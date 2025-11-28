import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

// Helper function to send the email
export async function sendTestEmail(email: string, otp: string): Promise<void> {
  // 1. DYNAMICALLY CREATE A TEST ACCOUNT
  // This is the cleanest way to get Ethereal credentials.
  const testAccount = await nodemailer.createTestAccount();

  console.log(`Ethereal User: ${testAccount.user}`);
  console.log(`Ethereal Pass: ${testAccount.pass}`);

  // 2. CREATE THE TRANSPORTER (using Ethereal credentials)
  const transporter: Transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure, // Will be false for port 587
    auth: {
      user: testAccount.user, // The generated Ethereal user email
      pass: testAccount.pass, // The generated Ethereal password
    },
  });

  const htmlBody = generateOtpEmailTemplate(otp);

  // 3. DEFINE THE EMAIL OPTIONS (The type checking here is very useful)
  const mailOptions = {
    from: '"Secure logic Otp Verification" <no-reply@example.com>',
    to: email,
    subject: "Your OTP Code",
    html: htmlBody,
  };

  try {
    // 4. SEND THE EMAIL
    const info = await transporter.sendMail(mailOptions);

    console.log("-------------------------------------------");
    console.log("Message sent: %s", info.messageId);

    // 5. PREVIEW THE EMAIL
    // The getTestMessageUrl function is only available when using Ethereal
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log("-------------------------------------------");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

export function generateOtpEmailTemplate(otp: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eaeaea; padding: 20px; border-radius: 10px;">
        <h2 style="color: #123458;">Your Verification Code</h2>
        <p>Use the following One-Time Password (OTP) to verify your account:</p>
        <div style="font-size: 32px; font-weight: bold; margin: 20px 0; color: #123458;">${otp}</div>
        <p style="color: #555;">This OTP is valid for <strong>3 minutes</strong>. Please do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
        <p style="font-size: 12px; color: #888;">If you did not request this code, please ignore this email.</p>
        <p style="font-size: 12px; color: #888;">Need help? Contact us at <a href="mailto:support@example.com">support@securelogicgroup.co</a></p>
    </div>
    `;
}
