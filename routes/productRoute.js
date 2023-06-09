const express = require("express");
const {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  rating,
  uploadImages,
} = require("../controller/productCtrl");
const { uploadPhoto, productImgResize } = require("../middlewares/uploadImage");
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, isAdmin, createProduct);

// uploading files/images route
router.put(
  "/upload/:id",
  authMiddleware,
  isAdmin,
  uploadPhoto.array("images", 10), //multer middleware
  productImgResize, //multer middleware
  uploadImages
);

router.get("/:id", getaProduct);
router.put("/wishlist", authMiddleware, addToWishlist);
router.put("/rating", authMiddleware, rating);

router.put("/:id", authMiddleware, isAdmin, updateProduct);
router.delete("/:id", authMiddleware, isAdmin, deleteProduct);

router.get("/", getAllProduct);

module.exports = router;
