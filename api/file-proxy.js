// 这个文件负责：接收前端请求 -> 验证激活码 -> 请求虚拟主机 bridge.php -> 返回数据给前端
const db = require('./db');
const fetch = require('node-fetch'); // Vercel Node 18+ 原生支持 fetch，如果报错请用 npm install node-fetch

module.exports = async (req, res) => {
    const { action, file, code } = req.query;

    // 1. 再次验证权限 (防止直接调接口)
    const [rows] = await db.execute('SELECT id FROM applications WHERE activation_code=? AND (status="approved" OR status="used")', [code]);
    if(rows.length === 0) return res.status(403).json({error: 'Invalid Code'});

    // 2. 构造请求虚拟主机的 URL
    // 你的虚拟主机 bridge 地址，例如: http://my-host.com/secret-files/bridge.php
    const BRIDGE_URL = process.env.VHOST_BRIDGE_URL; 
    const BRIDGE_SECRET = process.env.VHOST_BRIDGE_SECRET;

    const targetUrl = `${BRIDGE_URL}?key=${BRIDGE_SECRET}&action=${action}&file=${file || ''}`;

    try {
        const remoteRes = await fetch(targetUrl);
        
        if (action === 'list') {
            const data = await remoteRes.json();
            res.json(data);
        } else if (action === 'get') {
            // 设置响应头为 PDF
            res.setHeader('Content-Type', 'application/pdf');
            // 管道流传输 (Stream piping)
            remoteRes.body.pipe(res); 
        }
    } catch (e) {
        res.status(500).send('Bridge Error');
    }
};