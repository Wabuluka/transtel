import { logger } from "../utils/logger.js";

export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = {
  // Catch 404 and forward to error handler
  notFound: (req, res, next) => {
    const error = new AppError(`Not found - ${req.originalUrl}`, 404);
    next(error);
  },

  // Global error handling middleware
  globalErrorHandler: (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    // Log error
    logger.error(
      `${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${
        req.method
      } - ${req.ip} - Stack: ${err.stack}`
    );

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
      const message = "Resource not found";
      error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      const message = "Duplicate field value entered";
      error = new AppError(message, 400);
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      const message = `Invalid input data. ${messages.join(". ")}`;
      error = new AppError(message, 400);
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
      const message = "Invalid token";
      error = new AppError(message, 401);
    }

    if (err.name === "TokenExpiredError") {
      const message = "Token expired";
      error = new AppError(message, 401);
    }

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  },

  // Async error handler wrapper (eliminates try-catch blocks)
  catchAsync: (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  },

  // Unhandled rejection handler
  unhandledRejectionHandler: (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    // Close server & exit process
    process.exit(1);
  },

  // Uncaught exception handler
  uncaughtExceptionHandler: (error) => {
    logger.error("Uncaught Exception thrown:", error);
    // Close server & exit process
    process.exit(1);
  },
};
