import express from "express";
import { registerUser, loginUser, getUserProfile, authenticate } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticate, getUserProfile);

export default router;
