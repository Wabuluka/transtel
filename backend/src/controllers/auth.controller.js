import { ENV } from "../configs/env.js";
import { redis } from "../configs/redis.js";
import User from "../models/user.model.js";
import jwt, { decode } from "jsonwebtoken";
import { logger } from "../utils/logger.js";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, ENV.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, ENV.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token: ${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // prevent XSS attacks - cross site scripting attack
    secure: ENV.NODE_ENV === "production",
    sameSite: "strict", // prevents CSRF - cross site request forgery
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // prevent XSS attacks - cross site scripting attack
    secure: ENV.NODE_ENV === "production",
    sameSite: "strict", // prevents CSRF - cross site request forgery
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn("User already exists");
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ name, email, password });

    //authenticate user
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    logger.error("Error in signup controller: ", error?.message);
    res.status(500).json({ message: error?.message });
  }
};

export const signin = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect)
      return res.status(400).json({ message: "Invalid credentials" });
    const { accessToken, refreshToken } = generateTokens(user._id);

    // store the cookie
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    logger.error("Error in signin controller: ", error?.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const signout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, ENV.REFRESH_TOKEN);
      await redis.del(`refresh_token: ${decoded.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    logger.info("Logged out successfully");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error("Error in logout controller: ", error?.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// generate an access token from refresh token
export const refreshToken = async (req, res) => {
  try {
    const refreshedToken = req.cookies.refreshToken;
    if (!refreshedToken) {
      logger.error("No refresh token provided");
      return res.status(401).json({ message: "No refresh token provided" });
    }
    const decoded = jwt.verify(refreshedToken, ENV.REFRESH_TOKEN_SECRET);
    // check stored key
    const storedToken = await redis.get(`refresh_token: ${decoded.userId}`);
    if (storedToken !== refreshedToken) {
      logger.error("Invalid refresh token");
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const { accessToken, refreshToken } = generateTokens(decoded.userId);
    // store the cookie
    await storeRefreshToken(decoded.userId, refreshToken);
    setCookies(res, accessToken, refreshToken);
    logger.info("Token refreshed successfully");
    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    logger.error("Error in refreshToken controller: ", error?.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getProfile = async (req, res) => {};
