import { ServiceName } from "@prisma/client";
import { z } from "zod";

export const quoteFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  phone: z.string().min(7).max(20),
  companyName: z.string().min(1).max(50),
  jobTitle: z.string().max(50).optional(),
  message: z.string().max(1000).optional(),
  services: z
    .array(z.nativeEnum(ServiceName))
    .min(1, "At least one service must be selected"),
  recaptchaToken: z.string().min(1),
});
