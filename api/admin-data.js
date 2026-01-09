const db = require('./db');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    const token = req.headers.authorization;
    try {
        jwt.verify(token, 'SECRET_KEY_JWT'); // 验证 Token
        const [rows] = await db.execute('SELECT * FROM applications ORDER BY id DESC');
        res.json(rows);
    } catch(e) { res.status(401).json({error: 'Unauthorized'}); }
};