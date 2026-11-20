import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";

// GET /api/reports/movement?from=2026-11-01&to=2026-11-30
export const getMovementReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const match = {};

    if (from || to) {
      match.createdAt = {};

      if (from) {
        const start = new Date(from);
        if (isNaN(start)) {
          return res.status(400).json({ message: "Invalid 'from' date" });
        }
        match.createdAt.$gte = start;
      }

      if (to) {
        const end = new Date(to);
        if (isNaN(end)) {
          return res.status(400).json({ message: "Invalid 'to' date" });
        }
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    const [products, movement] = await Promise.all([
      Product.find().sort({ name: 1 }),

      // One group per product, adding up In and Out separately
      Transaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$product",
            stockIn: {
              $sum: { $cond: [{ $eq: ["$type", "In"] }, "$quantity", 0] },
            },
            stockOut: {
              $sum: { $cond: [{ $eq: ["$type", "Out"] }, "$quantity", 0] },
            },
          },
        },
      ]),
    ]);

    // Look up each product's movement quickly by its id
    const byProduct = new Map(movement.map((m) => [String(m._id), m]));

    const rows = products.map((p) => {
      const m = byProduct.get(String(p._id));
      const stockIn = m?.stockIn || 0;
      const stockOut = m?.stockOut || 0;

      return {
        _id: p._id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        stockIn,
        stockOut,
        net: stockIn - stockOut,
        currentStock: p.stock,
        reorderLevel: p.reorderLevel,
      };
    });

    const totals = rows.reduce(
      (sum, r) => ({
        stockIn: sum.stockIn + r.stockIn,
        stockOut: sum.stockOut + r.stockOut,
        net: sum.net + r.net,
      }),
      { stockIn: 0, stockOut: 0, net: 0 },
    );

    res.json({ rows, totals });
  } catch (error) {
    next(error);
  }
};
