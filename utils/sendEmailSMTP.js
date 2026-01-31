const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmailSMTP({ to, subject, html, text }) {
  const info = await transporter.sendMail({
    // 🔥 MUST be the Gmail account itself
    from: `Middleman <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text
  });

  console.log("SMTP EMAIL SENT:", info.messageId);
  return info;
}

module.exports = sendEmailSMTP;
