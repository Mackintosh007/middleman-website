const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html, text }) {
  try {
    const response = await resend.emails.send({
      from: process.env.FROM_EMAIL || "Middleman <no-reply@middlemanng.com>",
      to: Array.isArray(to) ? to : [to], // ✅ IMPORTANT
      subject,
      html,
      text
    });

    console.log("RESEND RESPONSE:", response);
    return response;
  } catch (err) {
    console.error("EMAIL SEND ERROR (RESEND):", err);
    throw err; 
  }
}

module.exports = sendEmail;
