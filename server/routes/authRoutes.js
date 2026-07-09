import express from "express";
import {
  registerUser,
  loginUser,
  googleAuth,
  sendPhoneOtp,
  verifyPhoneOtp,
  getUserProfile,
  authenticate,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/phone/send-otp", sendPhoneOtp);
router.post("/phone/verify-otp", verifyPhoneOtp);
router.get("/me", authenticate, getUserProfile);

export default router;
