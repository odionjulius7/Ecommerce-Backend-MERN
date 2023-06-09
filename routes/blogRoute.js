const express = require("express");
const {
  createBlog,
  updateBlog,
  getBlog,
  getAllBlogs,
  deleteBlog,
  liketheBlog,
  disliketheBlog,
  uploadImages,
} = require("../controller/blogCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { blogImgResize, uploadPhoto } = require("../middlewares/uploadImage");
const router = express.Router();

/*
 * Mind the way you position your routes, :id params / midleware
 * should be placed accordingly should placed, to avoid conflict
 */
router.post("/", authMiddleware, isAdmin, createBlog);

// upload and resize blog images
router.put(
  "/upload/:id",
  authMiddleware,
  isAdmin,
  uploadPhoto.array("images", 2),
  blogImgResize,
  uploadImages
);

router.put("/dislikes", authMiddleware, disliketheBlog);
router.put("/likes", authMiddleware, liketheBlog);

router.put("/:id", authMiddleware, isAdmin, updateBlog);

router.get("/:id", getBlog);
router.get("/", getAllBlogs);

router.delete("/:id", authMiddleware, isAdmin, deleteBlog);

module.exports = router;
