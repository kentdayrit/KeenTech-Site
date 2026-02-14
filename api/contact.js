import { Resend } from "resend";
import fetch from "node-fetch";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { name, email, phone, subject, message, 'recaptcha-token': token } = req.body;

    if (!name || !email || !subject || !message || !token) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify reCAPTCHA
    const recaptchaRes = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      { method: "POST" }
    );

    const recaptchaData = await recaptchaRes.json();
    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      return res.status(400).json({ error: "reCAPTCHA verification failed" });
    }

    // Send email
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "info@keentech-it.com",
      subject: subject,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Phone:</strong> ${phone || "N/A"}</p>
             <p><strong>Message:</strong><br>${message}</p>`
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err); // logs will show in Vercel dashboard
    res.status(500).json({ error: "Server error" });
  }
}
