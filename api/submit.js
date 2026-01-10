import db from './db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    try {
        const { name, contact } = req.body;

        await db.execute(
            'INSERT INTO applications (name, contact, status) VALUES (?, ?, "pending")',
            [name, contact]
        );

        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
