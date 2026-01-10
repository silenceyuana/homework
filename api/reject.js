import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import db from './db.js';
import parseBody from './parseBody.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    // ===== JWT 校验 =====
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const token = auth.slice(7);
    jwt.verify(token, process.env.JWT_SECRET);

    // ===== 参数 =====
    const { id, reason } = await parseBody(req);
    if (!id || !reason) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // ===== 查询用户 =====
    const [rows] = await db.execute(
      'SELECT contact FROM applications WHERE id=?',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ===== 发送拒绝邮件（先发）=====
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

    // ===== 邮件成功后再更新数据库 =====
    await db.execute(
      'UPDATE applications SET status="rejected", reject_reason=? WHERE id=?',
      [reason, id]
    );

    return res.json({ success: true });

  } catch (e) {
    console.error('REJECT ERROR:', e);
    return res.status(500).json({ error: e.message });
  }
}
