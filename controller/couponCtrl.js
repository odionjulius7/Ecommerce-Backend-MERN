const Coupon = require("../models/couponModel");
const validateMongoDbId = require("../utils/validateMongodbId");
const asyncHandler = require("express-async-handler");

const createCoupon = asyncHandler(async (req, res) => {
  try {
    const newCoupon = await Coupon.create(req.body);
    res.json(newCoupon);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllCoupons = asyncHandler(async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (error) {
    throw new Error(error);
  }
});

const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const updatecoupon = await Coupon.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json({ msg: "updated successfully", updatecoupon });
  } catch (error) {
    throw new Error(error);
  }
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletecoupon = await Coupon.findByIdAndDelete(id);
    res.json({ msg: "deleted successfully", deletecoupon });
  } catch (error) {
    throw new Error(error);
  }
});

const getCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const getAcoupon = await Coupon.findById(id);
    res.json(getAcoupon);
  } catch (error) {
    throw new Error(error);
  }
});
module.exports = {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  getCoupon,
};
