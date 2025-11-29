// services/sendContactSheet.ts

import { Parser } from "json2csv";
import nodemailer from "nodemailer";
import prisma from "../prisma.js";
import { createEtherealTransporter } from "../config/mail.js";

interface CSVRowData {
  id: string;
  name: string;
  email: string;
  message: string | null;
  createdAt: string;
  email_sent?: boolean;
}

// CSV generator
function generateCSV(data: CSVRowData[]) {
  const fields = ["id", "name", "email", "message", "createdAt"];
  const parser = new Parser({ fields });
  return parser.parse(data);
}

export async function sendContactSheet() {
  try {
    // 1. Get all unsent contacts
    const rows = await prisma.contactMessage.findMany({
      where: { email_sent: false },
      orderBy: { createdAt: "asc" },
    });
    console.log("rows: ", rows);

    if (!rows.length) {
      console.log("[sendContactSheet] No new contact messages");
      return;
    }

    console.log(`[sendContactSheet] Found ${rows.length} new contacts`);

    // 2. Format rows for CSV
    const formattedRows = rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));

    // 3. Generate CSV
    const csv = generateCSV(formattedRows);
    const fileBuffer = Buffer.from(csv, "utf-8");
    const filename = `contact_messages_${Date.now()}.csv`;

    // 4. Create transporter
    const transporter = await createEtherealTransporter();

    // 5. Send Email
    const info = await transporter.sendMail({
      from: `"Contact Messages Report" <no-reply@example.com>`,
      to: "admin@example.com",
      subject: "New Contact Messages",
      text: "Attached is the latest Contact Messages export.",
      attachments: [
        {
          filename,
          content: fileBuffer,
        },
      ],
    });

    console.log("[sendContactSheet] Export email sent!");
    console.log("[Preview URL]:", nodemailer.getTestMessageUrl(info));

    // 6. Mark rows as sent
    await prisma.contactMessage.updateMany({
      where: {
        id: { in: rows.map((r) => r.id) },
      },
      data: {
        email_sent: true,
      },
    });

    console.log("[sendContactSheet] Marked messages as sent");
  } catch (err) {
    console.error("[sendContactSheet] ERROR:", err);
  }
}
