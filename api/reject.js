const db = require('./db');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const parseBody = require('./parseBody');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
    try {
        jwt.verify(req.headers.authorization, 'SECRET_KEY_JWT');
        const { id, reason } = await parseBody(req);

        const [rows] = await db.execute(
            'SELECT contact FROM applications WHERE id=?',
            [id]
        );
        if (!rows.length) throw new Error('User not found');

        await db.execute(
            'UPDATE applications SET status="rejected", reject_reason=? WHERE id=?',
            [reason, id]
        );

        await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: rows[0].contact,
            subject: '【审核未通过】文件查阅申请',
            html: `<p>拒绝原因：${reason}</p>`
        });

        res.end(JSON.stringify({ success: true }));
    } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
    }
};
