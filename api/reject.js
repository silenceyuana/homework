import db from './db';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    try {
        jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        const { id, reason } = req.body;

        const [[app]] = await db.execute(
            'SELECT contact FROM applications WHERE id=?',
            [id]
        );

        await db.execute(
            'UPDATE applications SET status="rejected", reject_reason=? WHERE id=?',
            [reason, id]
        );

        await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: app.contact,
            subject: '【审核未通过】申请结果',
            html: `<p>原因：${reason}</p>`
        });

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
