import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

dotenv.config();

const userEmail = process.env.USER_EMAIL!;
const smtpPassword = process.env.SMTP_PASSWORD!;

class EmailService {
  private transporter!: Transporter;

  constructor() {}

  private async createTransporter(): Promise<void> {
    console.log("credentials", { user: userEmail, pass: smtpPassword });
    this.transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: userEmail,
        pass: smtpPassword,
      },
    });
  }

  public async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    if (!this.transporter) {
      await this.createTransporter();
    }

    const mailOptions = {
      from: userEmail,
      to,
      subject,
      text,
      html,
      // attachments: [
      //   {
      //     filename: "secure_logic_logo.png",
      //     path: path.join(
      //       __dirname,
      //       "../emailTemplates/assets/secure_logic_logo.png",
      //     ),
      //     cid: "securelogic_logo",
      //   },
      // ],
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
    } catch (err) {
      console.error("Email send error:", err);
    }
  }
}

export default new EmailService();
