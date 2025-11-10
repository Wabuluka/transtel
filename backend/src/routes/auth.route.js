import express from "express";
import {
  signin,
  signout,
  signup,
  refreshToken,
  getProfile,
} from "../controllers/auth.controller.js";

const router = express.Router();
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);
router.post("/refresh-token", refreshToken);
router.get("/profile", getProfile);

export default router;
