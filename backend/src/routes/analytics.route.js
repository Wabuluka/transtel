import express from "express";

import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
  getAnalyticsData,
  getDailySalesData,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, async () => {
  try {
    const analyticsData = await getAnalyticsData();
    const startDate = new Date();
    const endDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const dailySalesData = await getDailySalesData(startDate, endDate);
    res.json({
      analyticsData,
      dailySalesData,
    });
  } catch (error) {
    logger.error("Error in checkOutSuccess controller: ", error?.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

export default router;
