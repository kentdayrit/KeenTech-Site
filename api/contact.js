import express from "express";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(".")); // serve index.html and main.js

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await resend.emails.send({
      from: "noreply@keentech-it.com",
      to: "info@keentech-it.com",
      subject: `New Contact Form: ${subject}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});