import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route.js";
import { ENV } from "./configs/env.js";
import { connectDB } from "./configs/db.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);

const PORT = ENV.PORT;
app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
  connectDB();
});
