const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // Gmail uses STARTTLS on 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  logger: true,   // 🔥 force logs
  debug: true     // 🔥 force debug output
});

// 🔍 VERIFY CONNECTION ON STARTUP
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP VERIFY FAILED:", error);
  } else {
    console.log("✅ SMTP SERVER IS READY");
  }
});

async function sendEmailSMTP({ to, subject, html, text }) {
  console.log("📤 SMTP SENDING TO:", to);

  const info = await transporter.sendMail({
    from: `Middleman <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text
  });

  console.log("✅ SMTP EMAIL SENT:", info.messageId);
  return info;
}

module.exports = sendEmailSMTP;
