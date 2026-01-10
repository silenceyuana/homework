const db = require('./db');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const parseBody = require('./parseBody');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  try {
    // ===== JWT 校验 =====
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      throw new Error('Missing token');
    }

    const token = auth.slice(7);
    jwt.verify(token, process.env.JWT_SECRET);

    // ===== 参数 =====
    const { id } = await parseBody(req);
    if (!id) throw new Error('Missing id');

    // ===== 生成激活码 =====
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    const expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // ===== 查询用户 =====
    const [rows] = await db.execute(
      'SELECT name, contact FROM applications WHERE id=?',
      [id]
    );
    if (!rows.length) throw new Error('User not found');

    // ===== 更新状态 =====
    await db.execute(
      'UPDATE applications SET status="approved", activation_code=?, expires_at=? WHERE id=?',
      [code, expires, id]
    );

    // ===== 发送邮件 =====
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: rows[0].contact,
      subject: '【审核通过】文件查阅权限已开通',
      html: `
        <h2>审核通过</h2>
        <p>您的激活码：</p>
        <p style="font-size:20px;font-weight:bold">${code}</p>
        <p>有效期至：${expires.toLocaleDateString()}</p>
      `
    });

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } catch (e) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: e.message }));
  }
};
