import { Resend } from 'resend';
import { getDb } from './db.js';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateCode(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  const db = getDb();

  // 1️⃣ 查询申请记录
  const row = db
    .prepare('SELECT * FROM applications WHERE id = ?')
    .get(id);

  if (!row) {
    return res.status(404).json({ error: 'Application not found' });
  }

  if (row.status !== 'PENDING') {
    return res.status(400).json({ error: 'Already processed' });
  }

  // 2️⃣ 生成激活码
  const code = generateCode();

  // 3️⃣ 更新数据库
  db.prepare(`
    UPDATE applications
    SET status = 'APPROVED',
        code = ?,
        processed_at = datetime('now')
    WHERE id = ?
  `).run(code, id);

  // 4️⃣ 发送通过邮件（内嵌 UI）
  await resend.emails.send({
    from: 'BetterYuan <no-reply@betteryuan.cn>',
    to: row.email,
    subject: '您的申请已通过',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f8fa;padding:40px">
        <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:32px">
          <h2 style="margin-top:0">申请已通过 🎉</h2>
          <p>您好 <b>${row.name || '用户'}</b>，</p>
          <p>您的申请已经通过审核，以下是您的激活码：</p>
          <div style="
            margin:24px 0;
            padding:16px;
            font-size:20px;
            text-align:center;
            background:#f1f3f4;
            border-radius:8px;
            letter-spacing:2px;
          ">
            ${code}
          </div>
          <p style="color:#666;font-size:14px">
            请妥善保存该激活码，如有问题请联系管理员。
          </p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px">
            本邮件由系统自动发送，请勿回复
          </p>
        </div>
      </div>
    `
  });

  return res.json({ success: true, code });
}
