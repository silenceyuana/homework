const db = require('../lib/db');

export default async function handler(req, res) {
    // 实际生产中这里应该加密码验证或Token验证，防止后台泄露
    try {
        const [rows] = await db.execute('SELECT * FROM applications ORDER BY id DESC');
        res.status(200).json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}