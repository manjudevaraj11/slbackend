import * as nodemailer from "nodemailer";

export async function createEtherealTransporter() {
  const testAccount = await nodemailer.createTestAccount();

  console.log(`Ethereal User: ${testAccount.user}`);
  console.log(`Ethereal Pass: ${testAccount.pass}`);

  // 2. CREATE THE TRANSPORTER (using Ethereal credentials)
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure, // Will be false for port 587
    auth: {
      user: testAccount.user, // The generated Ethereal user email
      pass: testAccount.pass, // The generated Ethereal password
    },
  });
}
