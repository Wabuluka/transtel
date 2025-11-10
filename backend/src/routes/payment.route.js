import express from "express";

import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
  createCheckoutSession,
  checkOutSuccess,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.post("/checkout-success", protectRoute, checkOutSuccess);
export default router;
