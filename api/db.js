const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,  // 改成 5，免费数据库通常承受不了 10
    queueLimit: 0,
    ssl: { rejectUnauthorized: false } // 【重要】很多云数据库需要加这行才能连上！
});

module.exports = pool;