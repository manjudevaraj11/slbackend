import { EmailTheme } from "../../config/theme.js";
import { loadTemplate } from "../../utils/loadTemplate.js";
import { renderTemplate } from "../../utils/renderTemplate.js";

export function buildOtpEmailTemplate(otp: string) {
  const templateHtml = loadTemplate("otpTemplate.html");

  return renderTemplate(templateHtml, {
    OTP: otp,
    COLOR_PRIMARY: EmailTheme.primary,
    COLOR_SECONDARY: EmailTheme.secondary,
    COLOR_TEXT: EmailTheme.textMain,
  });
}
