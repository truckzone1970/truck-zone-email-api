// api/contact.js
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import { z, ZodError } from "zod";
import { renderCustomerAutoReply, renderInternalLead } from "./templates.js";

/** CORS: allow one or more origins via env (comma-separated) */
const ALLOW_LIST = (process.env.CORS_ORIGIN || "https://truck-zone.ca")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOW_LIST.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName:  z.string().min(1, "Last name is required"),
  email:     z.string().email("Valid email required"),
  phone:     z.string().optional().nullable(),
  subject:   z.string().min(1, "Subject is required"),
  message:   z.string().min(1, "Message is required"),
});

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method Not Allowed" });

  // Some runtimes pass body as a string; normalize to object.
  if (req.headers["content-type"]?.includes("application/json") && typeof req.body === "string") {
    try { req.body = JSON.parse(req.body); }
    catch { return res.status(400).json({ ok:false, error:"Invalid JSON" }); }
  }

  try {
    const data = contactSchema.parse(req.body || {});

    // --- SMTP setup ---
    const secure = String(process.env.SMTP_SECURE ?? "true") === "true";
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,                        // e.g. server71.web-hosting.com
      port: Number(process.env.SMTP_PORT || (secure ? 465 : 587)),
      secure,                                             // 465=true, 587=false
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { servername: process.env.SMTP_HOST },         // ✅ SNI for shared hosts
    });

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ ok:false, error:"SMTP not configured" });
    }

    // Leave on while debugging; you can remove later.
    await transporter.verify().catch(e => {
      console.error("SMTP verify failed:", e?.message || e);
      throw new Error("SMTP verification failed");
    });

    // --- Attachment path & CID ---
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const logoPath  = path.join(__dirname, "assets", "logo-email.png");
    const logoCid   = process.env.LOGO_CID || "truckzone-logo";
    const attachments = fs.existsSync(logoPath)
      ? [{
          filename: "logo-email.png",
          path: logoPath,
          cid: logoCid,
          contentDisposition: "inline",
          contentType: "image/png",
        }]
      : [];

    const brandName = process.env.BRAND_NAME || "Truck Zone";
    const brandUrl  = process.env.BRAND_URL  || "https://truck-zone.ca";
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const inboxTo   = process.env.TO_EMAIL   || process.env.SMTP_USER;

    // 1) Internal notification
    await transporter.sendMail({
      from: `"${brandName} Website" <${fromEmail}>`,
      to: inboxTo,
      subject: `New inquiry: ${data.subject} — ${data.firstName} ${data.lastName}`,
      replyTo: data.email,
      html: renderInternalLead({ ...data, brandName, brandUrl, logoCid }),
      attachments,
    });

    // 2) Auto-reply to customer
    await transporter.sendMail({
      from: `"${brandName} Support" <${fromEmail}>`,
      to: data.email,
      subject: `Thanks, ${data.firstName}! We received your request ✅`,
      html: renderCustomerAutoReply({ ...data, brandName, brandUrl, logoCid }),
      attachments,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ ok:false, error: err.issues?.[0]?.message || "Validation error" });
    }
    console.error("contact handler error:", err?.message || err);
    return res.status(500).json({ ok:false, error:"Internal Server Error" });
  }
}
