const jwt = require('jsonwebtoken');
const parseBody = require('./parseBody');

module.exports = async (req, res) => {
    try {
        const { password } = await parseBody(req);

        if (password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { role: 'admin' },
                'SECRET_KEY_JWT',
                { expiresIn: '1h' }
            );
            res.end(JSON.stringify({ token }));
        } else {
            res.statusCode = 401;
            res.end(JSON.stringify({ error: 'Wrong password' }));
        }
    } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
    }
};
