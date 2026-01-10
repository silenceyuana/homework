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
    const { id, reason } = await parseBody(req);
    if (!id || !reason) throw new Error('Missing parameters');

    // ===== 查询用户 =====
    const [rows] = await db.execute(
      'SELECT contact FROM applications WHERE id=?',
      [id]
    );
    if (!rows.length) throw new Error('User not found');

    // ===== 更新状态 =====
    await db.execute(
      'UPDATE applications SET status="rejected", reject_reason=? WHERE id=?',
      [reason, id]
    );

    // ===== 发送邮件 =====
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: rows[0].contact,
      subject: '【审核未通过】文件查阅申请',
      html: `
        <h2>审核未通过</h2>
        <p>原因：</p>
        <p style="color:red">${reason}</p>
      `
    });

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } catch (e) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: e.message }));
  }
};
