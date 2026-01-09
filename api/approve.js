const db = require('./db');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const crypto = require('crypto'); // 引入 crypto 库用于生成更随机的字符串

const resend = new Resend(process.env.RESEND_API_KEY);

// 漂亮的邮件 HTML 模板 (保持不变，或根据审美微调)
const getHtml = (title, message, code = null) => `
<!DOCTYPE html>
<html>
<body style="background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #6366f1, #ec4899); padding: 36px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: 1px;">${title}</h1>
    </div>
    <div style="padding: 40px 32px; color: #374151; line-height: 1.7;">
      <p style="font-size: 16px; margin-top: 0;">您好，</p>
      <p style="font-size: 16px; margin-bottom: 30px;">${message}</p>
      
      ${code ? `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
        <span style="display: block; text-transform: uppercase; color: #64748b; font-size: 12px; font-weight: 600; letter-spacing: 1px; margin-bottom: 8px;">您的专属访问凭证</span>
        <!-- 这里调整了字号以适应 16 位长验证码 -->
        <span style="display: block; font-family: 'Courier New', monospace; font-size: 24px; font-weight: 700; color: #4f46e5; word-break: break-all; letter-spacing: 2px;">${code}</span>
        <span style="display: block; color: #ef4444; font-size: 13px; margin-top: 12px; font-weight: 500;">有效期：3天 · 仅限本人使用</span>
      </div>
      <div style="text-align: center; margin-bottom: 20px;">
        <a href="https://${process.env.VERCEL_URL}/view.html" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">立即前往查阅文件</a>
      </div>
      ` : ''}
      
      <p style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">
        此邮件由系统自动发送，请勿回复。<br>
        如果您并未申请此权限，请忽略此邮件。
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
        const { id } = req.body;
        
        // --- 修改开始：生成 16 位不规则激活码 ---
        // 使用 crypto 生成 8 字节的 hex 字符串 (16字符)，或者使用 base64 截取
        // 这里使用自定义字符集生成，确保不含容易混淆的字符（如 I, l, 1, O, 0）
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let code = '';
        for (let i = 0; i < 16; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // --- 修改结束 ---

        const expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3天

        // 获取用户信息
        const [rows] = await db.execute('SELECT contact, name FROM applications WHERE id=?', [id]);
        if(rows.length === 0) throw new Error('No user');
        const { contact, name } = rows[0];

        // 存入数据库
        // 注意：请确保你的数据库 applications 表的 activation_code 字段长度足够！
        // 建议执行 SQL: ALTER TABLE applications MODIFY activation_code VARCHAR(32);
        await db.execute('UPDATE applications SET status="approved", activation_code=?, expires_at=? WHERE id=?', [code, expires, id]);

        // 发送邮件
        await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: contact,
            subject: '【审核通过】文件查阅权限已开通',
            html: getHtml('审核通过', `${name}，您的文件查阅申请已通过审核。请复制下方的 16 位访问凭证登录系统。`, code)
        });

        res.json({success: true});
    } catch(e) { 
        console.error(e);
        res.status(500).json({error: e.message}); 
    }
};