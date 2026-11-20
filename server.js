import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";

const required = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
