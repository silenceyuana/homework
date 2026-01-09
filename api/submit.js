const db = require('../lib/db');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    const { name, contact } = req.body;
    try {
        await db.execute('INSERT INTO applications (name, contact) VALUES (?, ?)', [name, contact]);
        res.status(200).json({ message: 'Success' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}