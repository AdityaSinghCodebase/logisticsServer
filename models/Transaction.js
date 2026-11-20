import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true },
    type: {
      type: String,
      enum: ["In", "Out"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    reference: { type: String, trim: true },
    department: { type: String, trim: true },
    notes: { type: String, trim: true },
    balanceAfter: { type: Number, required: true },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    performedByName: { type: String, required: true },
  },
  { timestamps: true },
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
