const { Resend } = require("resend");
const sendEmailSMTP = require("./sendEmailSMTP");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html, text }) {
  // Always normalize recipient
  const recipients = Array.isArray(to) ? to : [to];

  try {
    const response = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: recipients,
      subject,
      html,
      text
    });

    const dailyQuota =
      response?.headers?.["x-resend-daily-quota"];

    console.log("RESEND RESPONSE:", response);

    // 🔴 If quota exhausted, fallback
    if (dailyQuota === "0") {
      throw new Error("Resend daily quota exhausted");
    }

    return response;
  } catch (err) {
    console.warn(
      "Resend failed, falling back to SMTP:",
      err.message
    );

    // 🔁 FALLBACK TO SMTP
    return await sendEmailSMTP({
      to: recipients.join(","),
      subject,
      html,
      text
    });
  }
}

module.exports = sendEmail;
