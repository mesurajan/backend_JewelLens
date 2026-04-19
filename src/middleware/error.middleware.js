import ApiError from "../utils/ApiError.js";

/**
 * Global Error Handler
 * Catches all errors thrown from asyncHandler or anywhere in controllers
 */
const errorMiddleware = (err, req, res, next) => {
  console.error(err); // Log full error for dev

  const isDev = process.env.NODE_ENV === "development";

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
    });
  }

  if (err?.name === "MulterError") {
    return res.status(400).json({
      status: 400,
      message: err.message || "File upload failed",
    });
  }

  // Fallback for unhandled or programming errors
  return res.status(500).json({
    status: 500,
    message: isDev
      ? err.message || "Internal Server Error"
      : "Internal Server Error",
  });
};

export default errorMiddleware;
