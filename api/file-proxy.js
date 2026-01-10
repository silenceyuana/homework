export default async function handler(req, res) {
    try {
        const { action, code, path } = req.query;

        if (!action || !code) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        const BRIDGE = process.env.VHOST_BRIDGE_URL;
        if (!BRIDGE) {
            return res.status(500).json({ error: 'Bridge not configured' });
        }

        // 只允许的 action，防止滥用
        if (!['list', 'download', 'preview'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }

        const url = new URL(BRIDGE);
        url.searchParams.set('action', action);
        url.searchParams.set('code', code);

        if (path) {
            url.searchParams.set('path', path);
        }

        const resp = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'User-Agent': 'Vercel-Proxy'
            }
        });

        const contentType = resp.headers.get('content-type') || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);

        // 文件流 / JSON 自动透传
        const buffer = Buffer.from(await resp.arrayBuffer());
        res.status(resp.status).send(buffer);

    } catch (err) {
        console.error('FILE PROXY ERROR:', err);
        res.status(500).json({ error: 'File proxy failed' });
    }
}
