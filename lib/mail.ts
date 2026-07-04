import nodemailer from "nodemailer";

export async function sendOtpEmail(to: string, otp: string) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "HRMS Portal <no-reply@workforce.com>";

  const isConfigured = !!(host && port && user && pass);

  // HTML template for the email
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 12px; background-color: #fcfcfc;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">Workforce HRMS</h1>
      </div>
      <div style="padding: 20px; color: #333333; line-height: 1.6;">
        <h2 style="color: #1e1b4b; font-size: 18px; margin-top: 0;">Two-Factor Identity Verification</h2>
        <p>You requested a verification code to access your HR workspace. Use the code below to complete your login:</p>
        
        <div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px; border: 1px dashed #cdcdd2;">
          <span style="font-size: 32px; font-weight: 800; font-family: monospace; letter-spacing: 4px; color: #4f46e5;">${otp}</span>
        </div>
        
        <p style="font-size: 13px; color: #6b7280;">This code is valid for <strong>5 minutes</strong>. If you did not request this login attempt, please change your password immediately.</p>
      </div>
      <div style="border-t: 1px solid #e5e7eb; padding-top: 15px; text-align: center; font-size: 11px; color: #9ca3af;">
        <p>© 2026 Workforce Portal. All rights reserved.</p>
      </div>
    </div>
  `;

  if (!isConfigured) {
    console.log(`\n\n=======================================\n⚠️ EMAIL DISPATCH SKIPPED (SMTP NOT CONFIGURED IN .env)\n✉️ TO: ${to}\n🔑 OTP CODE: ${otp}\n=======================================\n\n`);
    return { success: false, error: "SMTP credentials not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port === "465", // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to,
      subject: `[Workforce HRMS] ${otp} is your verification code`,
      text: `Your Workforce HRMS verification code is: ${otp}. Valid for 5 minutes.`,
      html: htmlContent,
    });

    console.log(`\n📧 Success: OTP email dispatched to ${to}\n`);
    return { success: true };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, error: "SMTP transmission failed" };
  }
}
