import fetch from "node-fetch";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body;

    // Validate required fields
    const { name, email, subject, message, phone, 'recaptcha-token': token } = body || {};
    if (!name || !email || !subject || !message || !token) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify reCAPTCHA
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    const recaptchaRes = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${token}`,
      { method: "POST" }
    );
    const recaptchaData = await recaptchaRes.json();
    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      return res.status(400).json({ error: "reCAPTCHA verification failed" });
    }

    // Send email via Resend
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "info@keentech-it.com",
      subject,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("Server Error:", err);
    // ALWAYS return JSON
    return res.status(500).json({ error: "Server error" });
  }
}
