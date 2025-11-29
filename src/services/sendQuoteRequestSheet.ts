import { Parser } from "json2csv";
import nodemailer from "nodemailer";
import prisma from "../prisma.js";
import { createEtherealTransporter } from "../config/mail.js";

interface QuoteRequestCSV {
  id: string;
  name: string;
  phone: string;
  email: string;
  companyName: string;
  message: string | null;
  jobTitle: string | null;
  services: string;
  createdAt: string;
  email_sent: boolean;
}

// CSV generator
function generateCSV(data: QuoteRequestCSV[]) {
  const fields = [
    "id",
    "name",
    "email",
    "phone",
    "companyName",
    "jobTitle",
    "services",
    "message",
    "createdAt",
  ];

  const parser = new Parser({ fields });
  return parser.parse(data);
}

export async function sendQuoteRequestSheet() {
  try {
    // 1. Fetch unsent Quote Requests
    const rows = await prisma.quoteRequest.findMany({
      where: { email_sent: false },
      orderBy: { createdAt: "asc" },
    });
    console.log("rows:qqqq ", rows);

    if (!rows.length) {
      console.log("[sendQuoteRequestSheet] No new quote requests");
      return;
    }

    console.log(
      `[sendQuoteRequestSheet] Found ${rows.length} new quote requests`,
    );

    // 2. Format rows for CSV
    const formattedRows = rows.map((r) => ({
      ...r,
      services: r.services.join(", "), // Convert array to CSV-safe string
      createdAt: r.createdAt.toISOString(),
    }));

    // 3. Build CSV
    const csv = generateCSV(formattedRows);
    const fileBuffer = Buffer.from(csv, "utf-8");
    const filename = `quote_requests_${Date.now()}.csv`;

    // 4. Email it
    const transporter = await createEtherealTransporter();

    const info = await transporter.sendMail({
      from: `"Quote Requests Report" <no-reply@example.com>`,
      to: "admin@example.com",
      subject: "New Quote Requests",
      text: "Attached is the latest Quote Requests export.",
      attachments: [
        {
          filename,
          content: fileBuffer,
        },
      ],
    });

    console.log("[sendQuoteRequestSheet] Email sent!");
    console.log("Preview:", nodemailer.getTestMessageUrl(info));

    // 5. Mark as sent
    await prisma.quoteRequest.updateMany({
      where: {
        id: { in: rows.map((r) => r.id) },
      },
      data: {
        email_sent: true,
      },
    });

    console.log("[sendQuoteRequestSheet] Marked rows as sent!");
  } catch (err) {
    console.error("[sendQuoteRequestSheet] ERROR:", err);
  }
}
