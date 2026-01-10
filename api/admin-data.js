const db = require('./db');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    try {
        jwt.verify(req.headers.authorization, 'SECRET_KEY_JWT');

        const [rows] = await db.execute(
            'SELECT id, name, contact, status, reject_reason, activation_code FROM applications ORDER BY id DESC'
        );

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(rows));
    } catch (e) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Unauthorized' }));
    }
};
