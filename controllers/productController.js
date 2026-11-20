import Product from "../models/Product.js";

import escapeRegex from "../utils/escapeRegex.js";

// GET /api/products?search=glo&category=Safety&lowStock=true
export const getProducts = async (req, res, next) => {
  try {
    const { search, category, lowStock } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: "i" };
    }
    if (category) {
      filter.category = category;
    }
    if (lowStock === "true") {
      filter.$expr = { $lte: ["$stock", "$reorderLevel"] };
    }

    const products = await Product.find(filter).sort({ name: 1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    const { name, category, unit, stock, reorderLevel } = req.body;
    const product = await Product.create({
      name,
      category,
      unit,
      stock,
      reorderLevel,
    });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    const { name, category, unit, reorderLevel } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, unit, reorderLevel },
      { new: true, runValidators: true },
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};
