import fetch from "node-fetch";

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export const verifyRecaptcha = async (token: string) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    throw new Error("reCAPTCHA secret key not set");
  }

  const url = "https://www.google.com/recaptcha/api/siteverify";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
    }),
  });

  const data = (await response.json()) as RecaptchaResponse;
  console.log("🔍 reCAPTCHA verify response:", data);

  return data.success === true;
};
