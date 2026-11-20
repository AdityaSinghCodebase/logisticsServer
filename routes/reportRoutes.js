import express from "express";
import { getMovementReport } from "../controllers/reportController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/movement", getMovementReport);

export default router;
