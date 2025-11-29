import { Request, Response } from "express";
import prisma from "../prisma.js";
import logger from "../utils/logger.js";

export const getQuoteRequest = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, companyName, jobTitle, message, services } =
      req.body;

    logger.info("reached here");

    const data = {
      name,
      email,
      phone,
      companyName,
      jobTitle,
      message,
      services,
    };

    await prisma.quoteRequest.create({
      data,
    });

    return res
      .status(200)
      .json({ message: "Quote request submitted successfully" });
  } catch (error) {
    console.error("Error in getQuote:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
