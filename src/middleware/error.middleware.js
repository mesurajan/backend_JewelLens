import ApiError from "../utils/ApiError.js";

/**
 * Global Error Handler
 * Catches all errors thrown from asyncHandler or anywhere in controllers
 */
const errorMiddleware = (err, req, res, next) => {
  console.error(err); // Log full error for dev

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
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