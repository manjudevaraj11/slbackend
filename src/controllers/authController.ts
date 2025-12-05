import { Request, Response } from "express";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/token.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../prisma.js";
// import TestEmailService from "../services/EmailServiceTesting.js";
import axios from "axios";
import { z } from "zod";
// import { loadTemplate } from "../utils/loadTemplate.js";
// import { EmailTheme } from "../config/theme.js";
import { buildOtpEmailTemplate } from "../emailTemplates/builders/otpBuilder.js";
import EmailService from "../services/EmailService.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = `${process.env.BASE_URL}/api/v1/auth/google/callback`;

// const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
// const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
// const LINKEDIN_REDIRECT_URI = `${process.env.BASE_URL}/api/v1/auth/linkedin/callback`;

const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .max(255, "Email must be under 255 characters"),
  password: z.string().nonempty({ message: "Password is required" }),
});

export const login = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Compare password
    const isValid = await bcrypt.compare(password, user.passwordHash!);
    if (!isValid)
      return res.status(401).json({ message: "Invalid credentials" });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // OLD Set cookies
    // res.cookie("accessToken", accessToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "strict",
    //   maxAge: 15 * 60 * 1000, // 15 * 1000, // 15 * 60 * 1000, // 15 minutes
    // });

    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "strict",
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 25 * 1000, //7 * 24 * 60 * 60 * 1000, // 7 days
    // });

    // NEW Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // strict
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 * 1000, // 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // strict
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 25 * 1000, //7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send response
    res.json({
      message: "Logged in",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: err.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const meSchema = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export const me = async (req: Request, res: Response) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  try {
    meSchema.parse({ accessToken, refreshToken });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ errors: err.issues });
    }
    return res.status(400).json({ message: "Invalid input" });
  }

  // ✅ Check for both tokens missing first (done)
  if (!accessToken && !refreshToken) {
    return res.status(400).json({
      status: "NO_TOKENS",
      message: "No authentication tokens present",
    });
  }

  // ✅ If only access token missing, client may attempt refresh (done)
  if (!accessToken && refreshToken) {
    return res.status(401).json({
      status: "ACCESS_TOKEN_MISSING",
      message: "Access token missing, try refresh",
    });
  }

  try {
    const payload = verifyAccessToken(accessToken!);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return res.status(404).json({
        status: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    // ✅ Success response includes status for consistent frontend handling
    return res.json({
      status: "SUCCESS",
      user,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    console.error("Access token validation failed:", message);

    return res.status(401).json({
      status: "EXPIRED_ACCESS_TOKEN",
      message: "Invalid or expired access token",
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const payload = verifyRefreshToken(token);

    // Fetch user from DB
    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token in DB (rotation)
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    // OLD Set cookies
    // res.cookie("accessToken", newAccessToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "strict",
    //   maxAge: 15 * 60 * 1000, // 15 * 1000 // 15 * 60 * 1000,
    // });

    // res.cookie("refreshToken", newRefreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "strict",
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 25 * 1000, // 15 * 60 * 1000,
    // });

    // NEW Set cookies
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // strict
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 * 1000, // 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // strict
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 25 * 1000, //7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ message: "Tokens refreshed" });
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: "refresh token expired" });
  }
};

export const logoutSchema = z.object({
  refreshToken: z.string().nonempty({ message: "Refresh token is required" }),
});

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    logoutSchema.parse({ refreshToken });

    if (refreshToken) {
      await prisma.user.updateMany({
        where: { refreshToken },
        data: { refreshToken: null },
      });
    }

    // clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.json({ message: "Logged out" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ errors: err.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const registerSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .max(255, "Email must be under 255 characters"),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(64, { message: "Password too long" }),
  name: z.string().min(1, { message: "Name is required" }),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, { message: "Invalid phone number format" })
    .optional(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.parse(req.body);
    let { email } = parsed;
    const { password, name, phoneNumber } = parsed;

    email = email.toLowerCase();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    // Case 1: Email verified → block registration
    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const verificationOtp = crypto.randomInt(100000, 999999).toString(); // 6-digit numeric OTP
    const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry

    const html = buildOtpEmailTemplate(verificationOtp);

    if (existingUser && !existingUser.emailVerified) {
      // Case 2: User exists but not verified → update OTP & expiry
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          name,
          phoneNumber,
          providers: { set: ["email"] },
          verificationOtp,
          otpExpiry,
        },
      });

      await EmailService.sendMail(
        email,
        "Secure Logic - Login Using OTP",
        `Your OTP is ${verificationOtp}`,
        html,
      );

      // await EmailService.sendMail(
      //   "Vamshi.Krishna@securelogicgroup.co",
      //   "Secure Logic - Login Using OTP",
      //   `Your OTP is ${verificationOtp}`,
      //   `<h1>Your OTP is ${verificationOtp}</h1>`
      // );

      // sendTestEmail(email, verificationOtp);

      // await TestEmailService.sendMail(
      //   email,
      //   "Secure Logic - Login Using OTP (TEST)",
      //   `Your OTP is ${verificationOtp}`,
      //   html
      // );

      return res
        .status(200)
        .json({ message: "Previous registration not verified. OTP resent." });
    }

    // Case 3: New user → create
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phoneNumber,
        emailVerified: false,
        verificationOtp,
        providers: { set: ["email"] },
        otpExpiry,
      },
    });
    // sendTestEmail(email, verificationOtp);

    // await TestEmailService.sendMail(
    //   email,
    //   "Secure Logic - Login Using OTP (TEST)",
    //   `Your OTP is ${verificationOtp}`,
    //   html
    // );

    await EmailService.sendMail(
      email,
      "Secure Logic - Login Using OTP",
      `Your OTP is ${verificationOtp}`,
      html,
    );

    // await EmailService.sendMail(
    //   "Vamshi.Krishna@securelogicgroup.co",
    //   "Your OTP Code",
    //   `Your OTP is ${verificationOtp}`,
    //   `<h1>Your OTP is ${verificationOtp}</h1>`
    // );

    res
      .status(201)
      .json({ message: "User registered. Please verify your email." });
  } catch (err) {
    console.log("err: ", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ errors: err.issues });
    }
    // console.error("Registration failed:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .max(255, "Email must be under 255 characters"),
  otp: z
    .string()
    .length(6, { message: "OTP must be 6 digits" })
    .regex(/^\d{6}$/, { message: "OTP must contain only numbers" }),
});

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Bad request" });

    // Check OTP and expiry
    if (!user.verificationOtp || user.verificationOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.otpExpiry && user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update email as verified
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationOtp: null,
        otpExpiry: null,
        refreshToken,
      },
    });

    // OLD Set cookies
    // res.cookie("accessToken", accessToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "strict",
    //   maxAge: 15 * 60 * 1000, // 15 * 1000, // 15 * 60 * 1000, // 15 minutes
    // });

    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "strict",
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 25 * 1000, //7 * 24 * 60 * 60 * 1000, // 7 days
    // });

    // NEW cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // strict
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 * 1000, // 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // strict
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 25 * 1000, //7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ errors: err.issues });
    }
    // console.error("Error verifying OTP:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const resendOtpSchema = z.object({
  email: z.string().email().max(255, "Email must be under 255 characters"),
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = resendOtpSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.emailVerified)
      return res.status(400).json({ message: "Email already verified" });

    // ✅ enforce cooldown (30s between sends)
    if (
      user.lastOtpSentAt &&
      Date.now() - new Date(user.lastOtpSentAt).getTime() < 30 * 1000
    ) {
      return res
        .status(429)
        .json({ message: "Please wait 30 seconds before requesting again." });
    }

    let otp = user.verificationOtp;
    let otpExpiry = user.otpExpiry;

    // ✅ if OTP missing or expired → generate new one
    const isExpired = !otpExpiry || otpExpiry < new Date();
    if (!otp || isExpired) {
      otp = generateOtp();
      otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry
    }

    // ✅ update last sent time, only regenerate fields if changed
    await prisma.user.update({
      where: { email },
      data: {
        verificationOtp: otp,
        otpExpiry,
        lastOtpSentAt: new Date(),
      },
    });

    console.log(`Resend OTP → ${email}: ${otp}`);

    const html = buildOtpEmailTemplate(otp);

    await EmailService.sendMail(
      email,
      "Secure Logic - Login Using OTP",
      `Your OTP is ${otp}`,
      html,
    );

    // await EmailService.sendMail(
    //   "Vamshi.Krishna@securelogicgroup.co",
    //   "Your OTP Code",
    //   `Your OTP is ${otp}`,
    //   `<h1>Your OTP is ${otp}</h1>`
    // );

    // ✅ send (or re-send) the OTP email
    // await sendTestEmail(email, otp);

    // await TestEmailService.sendMail(
    //   email,
    //   "Secure Logic - Login Using OTP (TEST)",
    //   `Your OTP is ${otp}`,
    //   html
    // );

    return res.json({
      message: isExpired
        ? "New OTP generated and sent."
        : "OTP resent successfully (same code).", // Please add only add otp send successfully.
    });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ errors: err.issues });

    console.error("Error resending OTP:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyUserSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .max(255, "Email must be under 255 characters"),
});

// Requires re-checks in test cases

export const verifyUser = async (req: Request, res: Response) => {
  try {
    const { email } = verifyUserSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(200).json({ status: "not_registered" });
    }

    if (!user.emailVerified) {
      return res.status(200).json({
        status: "pending_verification",
        email: user.email,
      });
    }

    return res.status(200).json({
      status: "registered",
      provider: user.providers,
      userName: user.name,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ errors: err.issues });
    }

    console.error("verifyUser error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const googleAuth = (req: Request, res: Response) => {
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
  res.redirect(redirectUrl);
};

export const googleCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      },
    );

    const { access_token } = tokenResponse.data;

    const userInfo = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const { sub: googleId, email, name, picture } = userInfo.data;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // New user
      user = await prisma.user.create({
        data: {
          email,
          name,
          profilePic: picture,
          googleId,
          providers: { set: ["google"] },
          emailVerified: true,
        },
      });
    } else if (!user.googleId) {
      // Existing email/password user → link Google
      user = await prisma.user.update({
        where: { email },
        data: {
          googleId,
          profilePic: user.profilePic || picture,
          providers: { push: "google" },
        },
      });
    } else {
      user = await prisma.user.update({
        where: { email },
        data: {
          profilePic: user.profilePic || picture,
        },
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { email },
      data: { refreshToken },
    });

    const sameSiteValue =
      process.env.NODE_ENV === "production"
        ? ("none" as const)
        : ("lax" as const);

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: sameSiteValue,
      path: "/",
      domain: ".securelogicgroup.co",
    };

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log("redirecting---", `${process.env.FRONTEND_URL}/oauth-success`);

    return res.redirect(`${process.env.FRONTEND_URL}/oauth-success`);
  } catch (err) {
    console.error("Google OAuth Error", err);
    return res.status(500).json({ error: "Google login failed" });
  }
};

// LinkedIn similar flow
// export const linkedinAuth = (req: Request, res: Response) => {
//   const redirectUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${LINKEDIN_REDIRECT_URI}&scope=r_emailaddress%20r_liteprofile`;
//   res.redirect(redirectUrl);
// };

// export const linkedinCallback = async (req: Request, res: Response) => {
//   const { code } = req.query;
//   try {
//     const tokenResponse = await axios.post(
//       "https://www.linkedin.com/oauth/v2/accessToken",
//       null,
//       {
//         params: {
//           grant_type: "authorization_code",
//           code,
//           redirect_uri: LINKEDIN_REDIRECT_URI,
//           client_id: LINKEDIN_CLIENT_ID,
//           client_secret: LINKEDIN_CLIENT_SECRET,
//         },
//       }
//     );

//     const access_token = tokenResponse.data.access_token;

//     // Fetch profile
//     const [profileRes, emailRes] = await Promise.all([
//       axios.get("https://api.linkedin.com/v2/me", {
//         headers: { Authorization: `Bearer ${access_token}` },
//       }),
//       axios.get(
//         "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
//         {
//           headers: { Authorization: `Bearer ${access_token}` },
//         }
//       ),
//     ]);

//     const linkedinId = profileRes.data.id;
//     const name = `${profileRes.data.localizedFirstName} ${profileRes.data.localizedLastName}`;
//     const email = emailRes.data.elements[0]["handle~"].emailAddress;

//     let user = await prisma.user.findUnique({ where: { email } });

//     if (!user) {
//       user = await prisma.user.create({
//         data: {
//           email,
//           name,
//           linkedinId,
//           providers: { set: ["linkedin"] },
//           emailVerified: true,
//         },
//       });
//     } else if (!user.linkedinId) {
//       user = await prisma.user.update({
//         where: { email },
//         data: { linkedinId, providers: { push: "linkedin" } },
//       });
//     }

//     setAuthCookies(res, user);
//     res.redirect(process.env.FRONTEND_URL! + "/dashboard");
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "LinkedIn login failed" });
//   }
// };
