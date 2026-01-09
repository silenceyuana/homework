const db = require('./db');

module.exports = async (req, res) => {
    const { code } = req.query;
    const [rows] = await db.execute('SELECT * FROM applications WHERE activation_code=? AND status="approved"', [code]);
    
    if(rows.length > 0) {
        const app = rows[0];
        if(new Date() < new Date(app.expires_at)) {
            // 这里不立即标记为 used，否则刷新页面就进不去了。
            // 策略：激活码有效期内可以无限次看，过期失效。
            // 如果必须 "只能用一次"，则在这里执行 UPDATE status='used'
             await db.execute('UPDATE applications SET status="used" WHERE id=?', [app.id]);
            return res.json({valid: true});
        }
    }
    res.json({valid: false});
};