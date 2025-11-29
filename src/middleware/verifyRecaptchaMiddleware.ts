import { NextFunction, Request, Response } from "express";
import { verifyRecaptcha } from "../services/recaptchaService.js";
import logger from "../utils/logger.js";

export const verifyRecaptchaMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { recaptchaToken } = req.body;
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
      return res.status(403).json({ error: "reCAPTCHA verification failed" });
    }
    logger.info("recaptcha validated----");
    next();
  } catch (err) {
    console.error("reCAPTCHA check failed:", err);
    return res.status(500).json({ error: "Internal reCAPTCHA error" });
  }
};
