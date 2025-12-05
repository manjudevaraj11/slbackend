import nodemailer, { Transporter } from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestEmailService {
  private transporter!: Transporter;

  constructor() {}

  private async createTransporter(): Promise<void> {
    // 1. Generate Ethereal test SMTP account
    const testAccount = await nodemailer.createTestAccount();

    console.log("ETHEREAL TEST ACCOUNT:");
    console.log("User:", testAccount.user);
    console.log("Pass:", testAccount.pass);

    // 2. Create transporter using Ethereal credentials
    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  public async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    // Create transporter if not existing
    if (!this.transporter) {
      await this.createTransporter();
    }

    const mailOptions = {
      from: '"Secure Logic Test Email" <no-reply@test.com>',
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: "secure_logic_logo.png",
          path: path.join(
            __dirname,
            "../emailTemplates/assets/secure_logic_logo.png",
          ),
          cid: "securelogic_logo",
        },
      ],
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      console.log("--------------------------------------------------");
      console.log("✉️ Test Email Sent!");
      console.log("Message ID:", info.messageId);

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("🔗 Preview URL:", previewUrl);
      } else {
        console.log("No preview URL available.");
      }

      console.log("--------------------------------------------------");
    } catch (error) {
      console.error("Test Email send error:", error);
    }
  }
}

export default new TestEmailService();
