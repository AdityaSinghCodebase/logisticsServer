import express from "express";
import { stockIn, stockOut } from "../controllers/stockController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("admin", "employee"));

router.post("/in", stockIn);
router.post("/out", stockOut);

export default router;
