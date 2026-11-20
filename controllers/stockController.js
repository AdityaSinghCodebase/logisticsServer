import mongoose from "mongoose";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";

// Small helper to make an error with a status code
// (our error handler from Step 26 reads err.statusCode)
const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const recordMovement = async (type, req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { productId, quantity, reference, department, notes } = req.body;
    const qty = Number(quantity);

    // 1. Check the input
    if (!productId) throw httpError(400, "Product is required");
    if (!Number.isInteger(qty) || qty < 1) {
      throw httpError(400, "Quantity must be a whole number of at least 1");
    }
    if (type === "In" && !reference?.trim()) {
      throw httpError(400, "Reference / PO number is required");
    }
    if (type === "Out" && !department?.trim()) {
      throw httpError(400, "Issue To / Department is required");
    }

    let transaction;

    // 2. Change the stock and save the record, all or nothing
    await session.withTransaction(async () => {
      const filter = { _id: productId };
      if (type === "Out") {
        filter.stock = { $gte: qty };
      }

      const product = await Product.findOneAndUpdate(
        filter,
        { $inc: { stock: type === "In" ? qty : -qty } },
        { new: true, session },
      );

      if (!product) {
        const current = await Product.findById(productId).session(session);
        if (!current) throw httpError(404, "Product not found");
        throw httpError(
          400,
          `Not enough stock. Only ${current.stock} available`,
        );
      }

      [transaction] = await Transaction.create(
        [
          {
            product: product._id,
            productName: product.name,
            type,
            quantity: qty,
            reference,
            department,
            notes,
            balanceAfter: product.stock,
            performedBy: req.user._id,
            performedByName: req.user.name,
          },
        ],
        { session },
      );
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

export const stockIn = (req, res, next) => recordMovement("In", req, res, next);
export const stockOut = (req, res, next) =>
  recordMovement("Out", req, res, next);
