const express = require("express");
const {
  createUser,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  loginAdmin,
  getWishlist,
  saveAddress,
  userCart,
  getUserCart,
  emptyCart,
  applyCoupon,
  createOrder,
  getOrders,
  updateOrderStatus,
  getAllOrders,
  getOrderByUserId,
  createUser2,
} = require("../controller/userCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();
router.post("/register", createUser2);
// router.post("/register", createUser);

router.post("/forgot-password-token", forgotPasswordToken);
router.put("/reset-password/:token", resetPassword);

router.put("/password", authMiddleware, updatePassword);
router.post("/login", loginUserCtrl);
router.post("/admin-login", loginAdmin);
router.post("/cart", authMiddleware, userCart);
router.post("/cart/applycoupon", authMiddleware, applyCoupon);
router.post("/cart/cash-order", authMiddleware, createOrder);
router.get("/all-users", authMiddleware, isAdmin, getallUser);
router.get("/get-orders", authMiddleware, getOrders);
router.get("/getallorders", authMiddleware, isAdmin, getAllOrders);
// router.get("/getorderbyuser", getOrderByUserId);
router.get("/getorderbyuser/:id", authMiddleware, isAdmin, getOrderByUserId);
router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);
router.get("/wishlist", authMiddleware, getWishlist);
router.get("/cart", authMiddleware, getUserCart);

router.get("/a-user/:id", authMiddleware, getaUser);
router.get("/:id", authMiddleware, isAdmin, getaUser);
router.delete("/empty-cart", authMiddleware, emptyCart);
router.delete("/:id", deleteaUser);

// only admin can update order status
router.put(
  "/order/update-order/:id",
  authMiddleware,
  isAdmin,
  updateOrderStatus
);
// router.put("/:id", updatedUser);// instead of updating using id from router, user the id gotten from the req.user
router.put("/edit-user", authMiddleware, updatedUser);
router.put("/save-address", authMiddleware, saveAddress);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);

module.exports = router;
