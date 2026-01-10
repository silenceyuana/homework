import db from './db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    try {
        jwt.verify(req.headers.authorization, process.env.JWT_SECRET);

        const [rows] = await db.execute(
            'SELECT id, name, contact, status, reject_reason, activation_code FROM applications ORDER BY id DESC'
        );

        res.json(rows);
    } catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
}
