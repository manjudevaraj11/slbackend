import { Router } from "express";
import {
  login,
  logout,
  refresh,
  register,
  verifyOtp,
  verifyUser,
  me,
  googleAuth,
  googleCallback,
  resendOtp,
} from "../controllers/authController.js";

const router = Router();

router.post("/auth/login", login);
router.get("/auth/me", me);
router.get("/auth/refresh", refresh);
router.post("/auth/logout", logout);
router.post("/auth/register", register);
router.post("/auth/verify-otp", verifyOtp);
router.post("/auth/resend-otp", resendOtp);
router.post("/auth/verify-user", verifyUser);

router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", googleCallback);

// TODO
// router.get('/auth/linkedin', linkedinAuth);
// router.get('/auth/linkedin/callback', linkedinCallback);

export default router;
