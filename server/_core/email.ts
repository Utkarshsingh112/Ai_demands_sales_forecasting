import nodemailer from "nodemailer";

function isSmtpConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    !process.env.SMTP_USER.includes("ethereal")
  );
}

export async function sendEmail(to: string, subject: string, html: string): Promise<{ sent: boolean }> {
  if (!isSmtpConfigured()) {
    console.log(`[Email] SMTP not configured — skipping send to ${to}`);
    return { sent: false };
  }

  const port = parseInt(process.env.SMTP_PORT || "587");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  try {
    await transporter.sendMail({
      from: `"ForecastIQ" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent "${subject}" to ${to}`);
    return { sent: true };
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return { sent: false };
  }
}

export function otpEmailHtml(otp: string, purpose: "verification" | "reset"): string {
  const title = purpose === "verification" ? "Verify Your Email" : "Reset Your Password";
  const body =
    purpose === "verification"
      ? "Use the code below to verify your email and complete your ForecastIQ registration."
      : "Use the code below to reset your ForecastIQ password.";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0F1117;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:48px 16px;">
<table width="480" cellpadding="0" cellspacing="0" style="background:#1C1E26;border-radius:12px;overflow:hidden;">
<tr><td style="padding:32px 40px 0;">
  <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#F59E0B;">ForecastIQ</p>
  <h1 style="margin:0 0 16px;font-size:24px;color:#F1F0ED;">${title}</h1>
  <p style="margin:0 0 32px;font-size:14px;color:#94A3B8;line-height:1.6;">${body}</p>
</td></tr>
<tr><td style="padding:0 40px;">
  <div style="background:#0F1117;border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:28px;text-align:center;">
    <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">Your one-time code</p>
    <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:10px;color:#F59E0B;font-family:monospace;">${otp}</p>
    <p style="margin:16px 0 0;font-size:12px;color:#64748B;">Valid for 15 minutes</p>
  </div>
</td></tr>
<tr><td style="padding:24px 40px 32px;">
  <p style="margin:0;font-size:12px;color:#475569;">If you didn't request this, you can safely ignore this email. Do not share this code with anyone.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
