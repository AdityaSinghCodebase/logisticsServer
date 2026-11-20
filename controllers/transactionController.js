import Transaction from "../models/Transaction.js";
import escapeRegex from "../utils/escapeRegex.js";

// GET /api/transactions?type=In&search=raj&from=2026-11-10&to=2026-11-17&page=1&limit=20
export const getTransactions = async (req, res, next) => {
  try {
    const { type, search, from, to } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

    const filter = {};

    if (type === "In" || type === "Out") {
      filter.type = type;
    }

    if (search) {
      const regex = { $regex: escapeRegex(search), $options: "i" };
      filter.$or = [
        { productName: regex },
        { reference: regex },
        { department: regex },
        { performedByName: regex },
      ];
    }

    if (from || to) {
      filter.createdAt = {};

      if (from) {
        const start = new Date(from);
        if (isNaN(start)) {
          return res.status(400).json({ message: "Invalid 'from' date" });
        }
        filter.createdAt.$gte = start;
      }

      if (to) {
        const end = new Date(to);
        if (isNaN(end)) {
          return res.status(400).json({ message: "Invalid 'to' date" });
        }
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};
