const db = require('./db');
const parseBody = require('./parseBody');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.statusCode = 405;
        return res.end();
    }

    try {
        const { name, contact } = await parseBody(req);

        await db.execute(
            'INSERT INTO applications (name, contact, status) VALUES (?, ?, "pending")',
            [name, contact]
        );

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
    } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
    }
};
