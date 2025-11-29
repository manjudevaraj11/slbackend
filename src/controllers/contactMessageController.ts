import { Request, Response } from "express";
import prisma from "../prisma.js";

export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;

    // Prevent spam: Limit email submissions within 5 minutes
    const recent = await prisma.contactMessage.findFirst({
      where: {
        email,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
    });

    if (recent) {
      return res.status(429).json({
        error:
          "You’ve already submitted a message recently. Please wait while we respond or try again later.",
      });
    }

    // Save message
    await prisma.contactMessage.create({
      data: { name, email, message },
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
