import fetch from "node-fetch";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { name, email, subject, message, phone, "recaptcha-token": token } = req.body || {};

    if (!name || !email || !subject || !message || !token) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ===== Verify reCAPTCHA =====
    const recaptchaRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      }
    );

    const recaptchaData = await recaptchaRes.json();

    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      return res.status(400).json({ error: "reCAPTCHA verification failed" });
    }

    // ===== Send Email to Admin =====
    await resend.emails.send({
      from: "KeenTech IT Consultancy <noreply@keentech-it.com>",
      to: "info@keentech-it.com",
      reply_to: email,
      subject: `New Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    // ===== Optional: Auto-Reply to Sender =====
    await resend.emails.send({
      from: "KeenTech IT Consultancy <noreply@keentech-it.com>",
      to: email,
      subject: "We received your message",
      html: `
        <p>Hi ${name},</p>
        <p>Thank you for contacting KeenTech IT Consultancy. We will get back to you within 24 hours.</p>
        <p><strong>Your Message:</strong></p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
        <p>Best regards,<br/>KeenTech Team</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Contact API Error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
}