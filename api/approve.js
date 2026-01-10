import nodemailer from 'nodemailer';

/**
 * Google 风格邮件模板
 */
function renderMailTemplate({ title, message, color, icon }) {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body {
        margin: 0;
        padding: 0;
        background: #f1f3f4;
        font-family: Roboto, Arial, sans-serif;
    }
    .card {
        max-width: 420px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(0,0,0,.1),
                    0 2px 6px rgba(0,0,0,.08);
        padding: 28px;
    }
    .icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: ${color};
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        margin-bottom: 16px;
    }
    h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
        color: #202124;
    }
    p {
        font-size: 14px;
        color: #5f6368;
        line-height: 1.6;
        margin-top: 12px;
    }
    .footer {
        margin-top: 24px;
        font-size: 12px;
        color: #9aa0a6;
    }
</style>
</head>
<body>
    <div class="card">
        <div class="icon">${icon}</div>
        <h2>${title}</h2>
        <p>${message}</p>
        <div class="footer">
            本邮件由系统自动发送，请勿回复
        </div>
    </div>
</body>
</html>
`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email, username } = req.body;

        if (!email || !username) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 465),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const html = renderMailTemplate({
            title: '申请已通过',
            message: `你好 <b>${username}</b>，你的申请已通过审核，现在可以正常使用相关服务。`,
            color: '#188038',
            icon: '✔'
        });

        await transporter.sendMail({
            from: `"系统通知" <${process.env.SMTP_USER}>`,
            to: email,
            subject: '申请通过通知',
            html
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Approve failed' });
    }
}
