import Coupon from "../models/coupon.model.js";
import { logger } from "../utils/logger.js";

export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });
    res.json(coupon || null);
  } catch (error) {
    logger.error("Error in getCoupon controller: ", error?.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const validateCoupon = async (rea, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({
      code: code,
      userId: req.user._id,
      isActive: true,
    });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    if (coupon.expirationDate < new Date()) {
      return res.status(400).json({ message: "Coupon expired" });
    }
    res.json({
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    logger.error("Error in validateCoupon controller: ", error?.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
