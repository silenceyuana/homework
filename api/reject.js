const db = require('./db');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// 复用上面的 HTML 模板逻辑 (稍微简化)
const getHtml = (title, message) => `
<!DOCTYPE html>
<html>
<body style="background-color: #f3f4f6; font-family: sans-serif; padding: 40px 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #6b7280, #374151); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
    </div>
    <div style="padding: 40px 30px; color: #374151; line-height: 1.6;">
      <p style="font-size: 16px;">您好，</p>
      <p style="font-size: 16px;">很抱歉地通知您，您的文件查阅申请未通过审核。</p>
      
      <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; color: #b91c1c;">
        <strong>原因：</strong> ${message}
      </div>

      <p>您可以根据上述原因修改信息后重新提交申请。</p>
      
      <p style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
        此邮件由系统自动发送，请勿回复。
      </p>
    </div>
  </div>
</body>
</html>
`;

module.exports = async (req, res) => {
    const token = req.headers.authorization;
    try {
        jwt.verify(token, 'SECRET_KEY_JWT');
        const { id, reason } = req.body; // 获取拒绝原因
        
        // 1. 获取邮箱
        const [rows] = await db.execute('SELECT contact, name FROM applications WHERE id=?', [id]);
        if(rows.length === 0) throw new Error('No user');
        const { contact, name } = rows[0];

        // 2. 更新数据库状态和原因
        await db.execute('UPDATE applications SET status="rejected", reject_reason=? WHERE id=?', [reason, id]);

        // 3. 发送拒绝邮件
        await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: contact,
            subject: '【审核结果】文件查阅申请未通过',
            html: getHtml('申请未通过', reason)
        });

        res.json({success: true});
    } catch(e) { 
        console.error(e);
        res.status(500).json({error: e.message}); 
    }
};