import express from "express";
import { analyzeCompany } from "../controllers/researchController.js";

const router = express.Router();

router.post("/analyze", analyzeCompany);

export default router;