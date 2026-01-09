const http = require('http');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const apiDir = __dirname;
const port = process.env.PORT || 3000;

function serveStatic(req, res, filepath) {
    fs.stat(filepath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.statusCode = 404; res.end('Not found'); return;
        }
        const stream = fs.createReadStream(filepath);
        res.statusCode = 200;
        stream.pipe(res);
    });
}

const server = http.createServer((req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        // API route handling: /api/<name>
        if (url.pathname.startsWith('/api/')) {
            const name = url.pathname.replace('/api/', '') || 'index';
            const apiFile = path.join(apiDir, `${name}.js`);
            if (fs.existsSync(apiFile)) {
                // Require and call the handler. Handlers expect (req, res).
                const handler = require(apiFile);
                // Normalize export (either function or object with default)
                const fn = typeof handler === 'function' ? handler : handler.default || handler;
                if (typeof fn === 'function') return fn(req, res);
            }
            res.statusCode = 404; res.end('API not found'); return;
        }

        // Serve static files from public
        let pathname = url.pathname === '/' ? '/index.html' : url.pathname;
        const filepath = path.join(publicDir, decodeURIComponent(pathname));
        serveStatic(req, res, filepath);
    } catch (e) {
        res.statusCode = 500; res.end('Server error');
    }
});

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
