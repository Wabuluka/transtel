import winston from "winston";
import "winston-daily-rotate-file";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

// Add colors to winston
winston.addColors(colors);

// Custom format for logs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.uncolorize(), // Remove colors for file output
  winston.format.printf((info) => {
    const { timestamp, level, message } = info;

    // Remove ANSI color codes and format levels consistently
    const cleanLevel = level
      .replace(/\x1b\[[0-9;]*m/g, "")
      .toUpperCase()
      .padEnd(5);
    const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, "");

    return `${timestamp} ${cleanLevel}: ${cleanMessage}`;
  })
);

// Define which transports to use based on environment
const transports = [
  // Console transport with colors
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // Daily rotate file for all logs - without colors
  new winston.transports.DailyRotateFile({
    filename: "logs/application-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    level: "info",
    format: fileFormat, // Use file format here
  }),

  // Daily rotate file for error logs - without colors
  new winston.transports.DailyRotateFile({
    filename: "logs/error-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
    level: "error",
    format: fileFormat, // Use file format here
  }),
];

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels,
  format: consoleFormat, // Default format (for console)
  transports,
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: "logs/exceptions.log",
      format: fileFormat, // Use file format for exception files too
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: "logs/rejections.log",
      format: fileFormat, // Use file format for rejection files too
    }),
  ],
});
