import db from './db.js';

export default async function handler(req, res) {
    const { code } = req.query;

    const [rows] = await db.execute(
        'SELECT * FROM applications WHERE activation_code=? AND status="approved"',
        [code]
    );

    if (rows.length && new Date() < new Date(rows[0].expires_at)) {
        return res.json({ valid: true });
    }

    res.json({ valid: false });
}
