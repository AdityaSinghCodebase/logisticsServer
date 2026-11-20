import express from "express";
import { login, getMe } from "../controllers/authController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", protect, getMe);

// TEMPORARY: only for testing roles, we'll delete it later
router.get("/admin-test", protect, authorizeRoles("admin"), (req, res) => {
  res.json({ message: `Hello ${req.user.name}, you are an admin` });
});

export default router;
