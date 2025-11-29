import { z } from "zod";

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be under 50 characters"),

  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be under 255 characters"),

  message: z
    .string()
    .min(5, "Message must be at least 5 characters long")
    .max(2000, "Message too long"),

  recaptchaToken: z.string().min(1, "Missing reCAPTCHA token"),
});
