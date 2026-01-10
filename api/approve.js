const db = require('./db');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const parseBody = require('./parseBody');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
    try {
        jwt.verify(req.headers.authorization, 'SECRET_KEY_JWT');
        const { id } = await parseBody(req);

        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let code = '';
        for (let i = 0; i < 16; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }

        const expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        const [rows] = await db.execute(
            'SELECT name, contact FROM applications WHERE id=?',
            [id]
        );
        if (!rows.length) throw new Error('User not found');

        await db.execute(
            'UPDATE applications SET status="approved", activation_code=?, expires_at=? WHERE id=?',
            [code, expires, id]
        );

        await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: rows[0].contact,
            subject: '【审核通过】文件查阅权限已开通',
            html: `<p>您的激活码：<b>${code}</b></p>`
        });

        res.end(JSON.stringify({ success: true }));
    } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
    }
};
