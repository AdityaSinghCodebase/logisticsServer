import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";

// "2026-11-19" for a date, in the given timezone
const dayKey = (date, timeZone) =>
  new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);

// GET /api/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    const timeZone = process.env.TIMEZONE || "Asia/Kolkata";
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();

    // The last 7 days, oldest first, ending today
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(dayKey(new Date(now - i * DAY), timeZone));
    }

    const [totals, movementRows, lowStock] = await Promise.all([
      // 1. Count the products and add up all the stock
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$stock" },
          },
        },
      ]),

      // 2. Quantity moved per day and per type (In / Out)
      Transaction.aggregate([
        { $match: { createdAt: { $gte: new Date(now - 8 * DAY) } } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: timeZone,
                },
              },
              type: "$type",
            },
            quantity: { $sum: "$quantity" },
          },
        },
      ]),

      // 3. The 5 products that are most below their reorder level
      Product.find({ $expr: { $lte: ["$stock", "$reorderLevel"] } })
        .sort({ stock: 1 })
        .limit(5)
        .select("name stock reorderLevel unit"),
    ]);

    // Make sure all 7 days exist, even days with no movement
    const movement = days.map((date) => {
      const sum = (type) =>
        movementRows.find((r) => r._id.date === date && r._id.type === type)
          ?.quantity || 0;

      return { date, stockIn: sum("In"), stockOut: sum("Out") };
    });

    const today = movement[movement.length - 1];

    res.json({
      totalProducts: totals[0]?.totalProducts || 0,
      totalStock: totals[0]?.totalStock || 0,
      stockInToday: today.stockIn,
      stockOutToday: today.stockOut,
      movement,
      lowStock,
    });
  } catch (error) {
    next(error);
  }
};
