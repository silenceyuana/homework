import db from './db.js';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    try {
        jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        const { id } = req.body;

        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        const code = Array.from({ length: 16 }, () =>
            chars[Math.floor(Math.random() * chars.length)]
        ).join('');

        const expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        const [[app]] = await db.execute(
            'SELECT contact FROM applications WHERE id=?',
            [id]
        );

        await db.execute(
            'UPDATE applications SET status="approved", activation_code=?, expires_at=? WHERE id=?',
            [code, expires, id]
        );

        await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: app.contact,
            subject: '【审核通过】访问权限已开通',
            html: `<p>激活码：<b>${code}</b></p>`
        });

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
