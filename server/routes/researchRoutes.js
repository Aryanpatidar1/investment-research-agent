import express from "express";
import { analyzeCompany } from "../controllers/researchController.js";
import { authenticate } from "../controllers/authController.js";

const router = express.Router();
router.post("/analyze", analyzeCompany);

export default router;