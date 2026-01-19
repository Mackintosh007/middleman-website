const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html, text }) {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || "Middleman <no-reply@middlemanng.com>",
      to,
      subject,
      html,
      text
    });
  } catch (err) {
    console.error("EMAIL SEND ERROR:", err);
  }
}

module.exports = sendEmail;
