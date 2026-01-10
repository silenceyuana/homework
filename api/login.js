import jwt from 'jsonwebtoken';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const { password } = req.body;

    if (password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(
            { role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Wrong password' });
    }
}
