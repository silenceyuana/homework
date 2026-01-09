const https = require('https');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

module.exports = async (req, res) => {
    try {
        const data = await fetchJson('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN');

        if (data && data.images && data.images.length > 0) {
            const baseUrl = 'https://www.bing.com';
            let imageUrl = baseUrl + data.images[0].url;
            imageUrl = imageUrl.replace('1920x1080', 'UHD');

            res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
            // send a 307 redirect to the actual image URL
            res.writeHead(307, { Location: imageUrl });
            return res.end();
        }

        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('No image found');
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error fetching Bing image');
    }
};