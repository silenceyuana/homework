import { Resend } from 'resend';
import { getDb } from './db.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, reason } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  const rejectReason = reason || '资料不完整，请补充后重新提交申请';

  const db = getDb();

  // 1️⃣ 查询记录
  const row = db
    .prepare('SELECT * FROM applications WHERE id = ?')
    .get(id);

  if (!row) {
    return res.status(404).json({ error: 'Application not found' });
  }

  if (row.status !== 'PENDING') {
    return res.status(400).json({ error: 'Already processed' });
  }

  // 2️⃣ 更新数据库
  db.prepare(`
    UPDATE applications
    SET status = 'REJECTED',
        reason = ?,
        processed_at = datetime('now')
    WHERE id = ?
  `).run(rejectReason, id);

  // 3️⃣ 发送拒绝邮件
  await resend.emails.send({
    from: 'BetterYuan <no-reply@betteryuan.cn>',
    to: row.email,
    subject: '您的申请未通过审核',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f8fa;padding:40px">
        <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:32px">
          <h2 style="margin-top:0;color:#d93025">申请未通过</h2>
          <p>您好 <b>${row.name || '用户'}</b>，</p>
          <p>很遗憾，您的申请未通过审核，原因如下：</p>
          <div style="
            margin:24px 0;
            padding:16px;
            background:#fce8e6;
            border-radius:8px;
            color:#a50e0e;
          ">
            ${rejectReason}
          </div>
          <p style="color:#666;font-size:14px">
            您可以根据提示修改后重新提交申请。
          </p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px">
            本邮件由系统自动发送，请勿回复
          </p>
        </div>
      </div>
    `
  });

  return res.json({ success: true });
}
