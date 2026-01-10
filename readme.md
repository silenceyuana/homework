CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL, -- 邮箱地址
    status ENUM('pending', 'approved', 'used') DEFAULT 'pending',
    activation_code VARCHAR(10),
    expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'used') DEFAULT 'pending',
    activation_code VARCHAR(10),
    expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE applications ADD COLUMN reject_reason TEXT;
ALTER TABLE applications MODIFY status ENUM('pending', 'approved', 'rejected', 'used') DEFAULT 'pending';

ALTER TABLE applications MODIFY activation_code VARCHAR(50);

bridge.php

<?php
// 设置一个密钥，防止别人直接访问这个PHP
$SECRET_KEY = 'YOUR_BRIDGE_SECRET_123'; // 必须与 Vercel 环境变量一致

if ($_GET['key'] !== $SECRET_KEY) {
    http_response_code(403);
    die('Access Denied');
}

$action = $_GET['action'];
$dir = __DIR__ . '/files'; // 假设你的PDF都在同级的 files 文件夹里

if ($action === 'list') {
    // 获取文件列表
    $files = array_diff(scandir($dir), array('.', '..'));
    $result = [];
    foreach ($files as $f) {
        if (pathinfo($f, PATHINFO_EXTENSION) === 'pdf') {
            $result[] = $f;
        }
    }
    header('Content-Type: application/json');
    echo json_encode($result);

} elseif ($action === 'get') {
    // 获取文件内容
    $file = $_GET['file'];
    // 安全检查，防止读取上一级目录
    if (strpos($file, '..') !== false) die('Invalid file');
    
    $path = $dir . '/' . $file;
    if (file_exists($path)) {
        header('Content-Type: application/pdf');
        readfile($path);
    } else {
        http_response_code(404);
        echo 'File not found';
    }
}
?>


变量名 (Key)	填写说明/示例值 (Value)
DB_HOST	你的 MySQL 数据库地址 (例如 Neon/PlanetScale 提供的地址)
DB_USER	数据库用户名
DB_PASSWORD	数据库密码
DB_NAME	数据库名称
ADMIN_PASSWORD	后台登录密码 (你自己设定的，比如 MySecurePass2024!)
VHOST_BRIDGE_URL	虚拟主机桥接文件地址 (例如 http://www.your-host.com/bridge.php)
VHOST_BRIDGE_SECRET	桥接密钥 (必须和虚拟主机里 bridge.php 文件里的 $SECRET_KEY 一模一样)
RESEND_API_KEY	Resend API Key (以 re_ 开头的密钥)
EMAIL_FROM	发件人地址 (例如 Acme <onboarding@resend.dev> 或你绑定的域名 Admin <noreply@yourdomain.com>)
VERCEL_URL	你的前台访问域名 (不带 https://，例如 your-project.vercel.app 或 www.your-custom-domain.com)



  await resend.emails.send({
    from: 'BetterYuan <no-reply@betteryuan.cn>',
    to: row.email,
    subject: '您的申请未通过审核',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f8fa;padding:40px">
        <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:32px">
          <h2 style="margin-top:0;color:#d93025">申请未通过</h2>
          <p>您好 <b>${row.name || '用户'}</b>，</p>
          <p>很遗憾，您的申请未通过审核，原因如下：</p>
          <div style="
            margin:24px 0;
            padding:16px;
            background:#fce8e6;
            border-radius:8px;
            color:#a50e0e;
          ">
            ${rejectReason}
          </div>
          <p style="color:#666;font-size:14px">
            您可以根据提示修改后重新提交申请。
          </p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px">
            本邮件由系统自动发送，请勿回复
          </p>
        </div>
      </div>
    `


      await resend.emails.send({
    from: 'BetterYuan <no-reply@betteryuan.cn>',
    to: row.email,
    subject: '您的申请已通过',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f8fa;padding:40px">
        <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:32px">
          <h2 style="margin-top:0">申请已通过 🎉</h2>
          <p>您好 <b>${row.name || '用户'}</b>，</p>
          <p>您的申请已经通过审核，以下是您的激活码：</p>
          <div style="
            margin:24px 0;
            padding:16px;
            font-size:20px;
            text-align:center;
            background:#f1f3f4;
            border-radius:8px;
            letter-spacing:2px;
          ">
            ${code}
          </div>
          <p style="color:#666;font-size:14px">
            请妥善保存该激活码，如有问题请联系管理员。
          </p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px">
            本邮件由系统自动发送，请勿回复
          </p>
        </div>
      </div>
    `
  });