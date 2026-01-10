import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { password } = req.body || {};

        if (!password) {
            return res.status(400).json({ error: 'Missing password' });
        }

        if (!process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'Server not configured' });
        }

        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign(
            { role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({ token });
    } catch (err) {
        console.error('LOGIN ERROR:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
