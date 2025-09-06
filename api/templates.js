// template.js
const brandColor = "#0ea5e9"; // sky-500
const darkText   = "#0f172a"; // slate-900
const subText    = "#475569"; // slate-600
const border     = "#e2e8f0"; // slate-200
const bg         = "#f8fafc"; // slate-50

// ✨ Base HTML. Note: no stray text. Use HTML comments if you need notes.
const base = ({ title, preview, bodyHtml, logoCid }) => `<!doctype html>
<html lang="en">
<head>
  <meta charSet="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    /* Basic email reset */
    body { margin:0; padding:0; background:${bg}; -webkit-font-smoothing:antialiased; }
    table { border-collapse:collapse; }
    img { border:0; outline:none; text-decoration:none; display:block; }
    a { color:${brandColor}; text-decoration:none; }
    /* Layout */
    .container { width:100%; padding:24px 0; }
    .card { max-width:640px; margin:0 auto; background:#fff; border:1px solid ${border}; border-radius:16px; overflow:hidden; }
    .header { padding:20px 24px; border-bottom:1px solid ${border}; background:#fff; }
    .title { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial; font-weight:800; font-size:24px; color:${darkText}; margin:0 0 8px 0; }
    .muted { color:${subText}; font-size:14px; line-height:20px; margin:0; }
    .content { padding:28px 24px; color:${darkText}; font-size:16px; line-height:24px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial; }
    .btn { display:inline-block; background:${brandColor}; color:#fff !important; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:700; }
    .footer { text-align:center; color:${subText}; font-size:12px; padding:18px 8px; }
    .pill { display:inline-block; padding:4px 10px; border-radius:9999px; background:${bg}; color:${subText}; font-size:12px; }
    /* Dark mode (supported clients only) */
    @media (prefers-color-scheme: dark) {
      body { background:#0b1220 }
      .card { background:#0f172a; border-color:#1e293b }
      .header { background:#0f172a; border-color:#1e293b }
      .title, .content { color:#e2e8f0 }
      .muted, .footer { color:#94a3b8 }
      .pill { background:#0b1220; color:#94a3b8 }
    }
  </style>
</head>
<body>
  <!-- Preheader (hidden preview text for inbox) -->
  <div style="display:none;opacity:0;color:transparent;height:0;width:0;overflow:hidden;visibility:hidden;">
    ${preview}
  </div>

  <div class="container">
    <table class="card" role="presentation" width="100%">
      <tr>
        <td class="header">
          <table role="presentation" width="100%">
            <tr>
              <td style="vertical-align:middle;">
                <!-- Brand logo (inline CID) -->
                <img src="cid:${logoCid || 'truckzone-logo'}" width="150" alt="${process.env.BRAND_NAME || 'Truck Zone'}" />
              </td>
              <td style="text-align:right; vertical-align:middle;">
                <span class="pill">${process.env.BRAND_DOMAIN || 'truck-zone.ca'}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td class="content">
          ${bodyHtml}
        </td>
      </tr>

      <tr>
        <td class="footer">
          © ${new Date().getFullYear()} ${process.env.BRAND_NAME || 'Truck Zone'}. All rights reserved.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

// ======== Branded blocks =========

export const renderCustomerAutoReply = ({ firstName, subject, brandName, brandUrl, logoCid }) => {
  const body = `
    <h1 class="title" style="color:${brandColor};">Thanks, ${escapeHtml(firstName)}! We received your message.</h1>
    <p class="muted" style="margin:8px 0 20px 0;">Subject: ${escapeHtml(subject)}</p>

    <p style="margin:0 0 18px 0;">Our support team will review your request and reply shortly. If it’s urgent, you can call us any time.</p>

    <p style="margin:22px 0 26px 0;">
      <a class="btn" href="${brandUrl}" target="_blank" rel="noopener">Visit ${escapeHtml(brandName)}</a>
    </p>

    <p class="muted" style="margin-top:16px;">
      You’re receiving this email because you contacted ${escapeHtml(brandName)}.
      If this wasn’t you, you can ignore this message.
    </p>
  `;
  return base({
    title: "We got your request",
    preview: "Thanks! We received your message and will reply shortly.",
    bodyHtml: body,
    logoCid,
  });
};

export const renderInternalLead = ({ firstName, lastName, email, phone, subject, message, brandName, logoCid }) => {
  const body = `
    <h1 class="title">New contact form submission</h1>
    <p class="muted" style="margin-top:8px;">${escapeHtml(brandName)} website lead</p>

    <table role="presentation" width="100%" style="margin:18px 0;border:1px solid ${border};border-radius:12px;">
      <tr><td style="padding:12px 16px;"><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</td></tr>
      <tr><td style="padding:12px 16px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      ${phone ? `<tr><td style="padding:12px 16px;"><strong>Phone:</strong> ${escapeHtml(phone)}</td></tr>` : ``}
      <tr><td style="padding:12px 16px;"><strong>Subject:</strong> ${escapeHtml(subject)}</td></tr>
      <tr><td style="padding:12px 16px;"><strong>Message:</strong><br/>${nl2br(escapeHtml(message))}</td></tr>
    </table>

    <p style="margin-top:10px;">
      <a class="btn" href="mailto:${escapeHtml(email)}?subject=Re:%20${encodeURIComponent(subject)}">Reply to customer</a>
    </p>
  `;
  return base({
    title: "New inquiry",
    preview: `New website inquiry from ${escapeHtml(firstName)} ${escapeHtml(lastName)}`,
    bodyHtml: body,
    logoCid,
  });
};

// ======== helpers =========
const escapeHtml = (s = "") =>
  String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
const nl2br = s => String(s).replace(/\n/g, "<br/>");

export { };
