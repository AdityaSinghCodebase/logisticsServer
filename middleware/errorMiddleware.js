// For URLs that don't exist
export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// The one place where all errors end up
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server error";

  // Invalid MongoDB id, like /api/products/123
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Duplicate value on a unique field, like the same product name twice
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Schema rules failed (required, min, enum...)
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Broken JSON sent in the request body
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON in request body";
  }

  // Log real server bugs, and don't leak their details to users
  if (statusCode === 500) {
    console.error(err);
    if (process.env.NODE_ENV === "production") {
      message = "Something went wrong";
    }
  }

  res.status(statusCode).json({ message });
};
