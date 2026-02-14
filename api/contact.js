import fetch from "node-fetch";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, phone, subject, message, 'recaptcha-token': token } = req.body;

  // Verify reCAPTCHA with Google
  const secretKey = process.env.RECAPTCHA_SECRET_KEY; // from Google
  const recaptchaRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secretKey}&response=${token}`
  });

  const recaptchaData = await recaptchaRes.json();
  if (!recaptchaData.success || recaptchaData.score < 0.5) {
    return res.status(400).json({ error: 'reCAPTCHA verification failed' });
  }

  // Send email via Resend
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "info@keentech-it.com",
      subject: subject,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Email sending failed' });
  }
}
