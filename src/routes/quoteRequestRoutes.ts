import express from "express";
import { contactMessageLimiter } from "../middleware/rateLimiter.js";
import { getQuoteRequest } from "../controllers/quoteController.js";
import { verifyRecaptchaMiddleware } from "../middleware/verifyRecaptchaMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { quoteFormSchema } from "../schemas/quote/schema.js";

const router = express.Router();

router.post(
  "/get-quote",
  validateRequest(quoteFormSchema),
  verifyRecaptchaMiddleware,
  contactMessageLimiter,
  getQuoteRequest,
);

export default router;
