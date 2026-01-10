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
    const { id } = await parseBody(req);
    if (!id) {
      return res.status(400).json({ error: 'Missing id' });
    }

    // ===== 查询用户 =====
    const [rows] = await db.execute(
      'SELECT name, contact FROM applications WHERE id=?',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ===== 生成激活码 =====
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    const expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // ===== 先发邮件（关键）=====
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

    // ===== 邮件成功后再更新数据库 =====
    await db.execute(
      'UPDATE applications SET status="approved", activation_code=?, expires_at=? WHERE id=?',
      [code, expires, id]
    );

    return res.json({ success: true });

  } catch (e) {
    console.error('APPROVE ERROR:', e);
    return res.status(500).json({ error: e.message });
  }
}
