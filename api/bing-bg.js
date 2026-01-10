export default async function handler(req, res) {
    try {
        const r = await fetch(
            'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN'
        );
        const data = await r.json();

        const img = data?.images?.[0];
        if (!img) return res.status(500).end();

        const url = ('https://www.bing.com' + img.url).replace('1920x1080', 'UHD');

        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.writeHead(307, { Location: url });
        res.end();
    } catch {
        res.status(500).end();
    }
}
