const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    const { password } = req.body;
    // 简单起见，管理员密码放在环境变量 ADMIN_PASSWORD
    if(password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({role: 'admin'}, 'SECRET_KEY_JWT', {expiresIn: '1h'});
        res.json({token});
    } else {
        res.status(401).json({error: 'Wrong password'});
    }
};