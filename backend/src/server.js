import express from "express";
import cookieParser from "cookie-parser";
import expressWinston from "express-winston";
import {
  errorHandler,
  AppError,
} from "./middleware/errorHandler.middleware.js";

import authRouter from "./routes/auth.route.js";
import { ENV } from "./configs/env.js";
import { connectDB } from "./configs/db.js";
import { logger } from "./utils/logger.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true, // Log meta data about request (default true)
    msg: "HTTP {{req.method}} {{req.url}} - {{res.statusCode}} - {{res.responseTime}}ms",
    expressFormat: true, // Use the default Express/morgan request formatting
    colorize: false, // Color the text and status code (default: false)
    ignoreRoute: (req, res) => {
      // Ignore health check routes from logs
      return req.url === "/health";
    },
  })
);

// HTTP response logging middleware
app.use(
  expressWinston.errorLogger({
    winstonInstance: logger,
  })
);

// Routes
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);

const PORT = ENV.PORT;
app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
  connectDB();
});
