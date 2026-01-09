const db = require('../lib/db');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { id, contact } = req.body;
    await db.execute('UPDATE applications SET contact = ? WHERE id = ?', [contact, id]);
    res.status(200).json({ success: true });
}