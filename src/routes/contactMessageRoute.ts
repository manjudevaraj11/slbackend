import express from "express";
import { submitContactForm } from "../controllers/contactMessageController.js";
import { contactMessageLimiter } from "../middleware/rateLimiter.js";
import { contactFormSchema } from "../schemas/contact/schema.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { verifyRecaptchaMiddleware } from "../middleware/verifyRecaptchaMiddleware.js";

const router = express.Router();

router.post(
  "/contact/message",
  validateRequest(contactFormSchema),
  verifyRecaptchaMiddleware,
  contactMessageLimiter,
  submitContactForm,
);

export default router;
