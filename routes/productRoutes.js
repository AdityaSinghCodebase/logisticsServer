import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getProducts);
router.get("/:id", getProductById);

router.post("/", authorizeRoles("admin"), createProduct);
router.put("/:id", authorizeRoles("admin"), updateProduct);
router.delete("/:id", authorizeRoles("admin"), deleteProduct);

export default router;
