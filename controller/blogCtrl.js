const Blog = require("../models/blogModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const { cloudinaryUploadImg } = require("../utils/cloudinary");
const fs = require("fs");

const createBlog = asyncHandler(async (req, res) => {
  try {
    const newBlog = await Blog.create(req.body);
    res.json(newBlog);
  } catch (error) {
    throw new Error(error);
  }
});

const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const updateBlog = await Blog.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json({ msg: "Blog updated", updateBlog });
  } catch (error) {
    throw new Error(error);
  }
});

const getBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const getBlog = await Blog.findById(id)
      .populate("likes")
      .populate("dislikes");
    const updateViews = await Blog.findByIdAndUpdate(
      id,
      {
        //  the $inc operator is used to increment a numeric field's value in a document
        // like views on Twitter, youtube etc..
        $inc: { numViews: 1 },
      },
      { new: true }
    );
    res.json(getBlog);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const getBlogs = await Blog.find();
    res.json(getBlogs);
  } catch (error) {
    throw new Error(error);
  }
});

const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletedBlog = await Blog.findByIdAndDelete(id);
    res.json({ msg: "Blog deleted", deletedBlog });
  } catch (error) {
    throw new Error(error);
  }
});

const liketheBlog = asyncHandler(async (req, res) => {
  const { blogId } = req.body;
  validateMongoDbId(blogId);
  // Find the blog which you want to be liked
  const blog = await Blog.findById(blogId);
  // check if it a user (logged in user), cos only a user can like and dislike a blog/post
  const loginUserId = req?.user?._id;
  // find if the user has liked the blog
  const isLiked = blog?.isLiked;
  // find if the user has disliked the blog
  const alreadyDisliked = blog?.dislikes?.find(
    // in the likes field serch the userId.toString to see if the logged in user id is on the list/array
    (userId) => userId?.toString() === loginUserId?.toString()
  );
  if (alreadyDisliked) {
    // if user alreadyDisliked , remove the user id frm he dislikes field N make isDisliked false
    const blog = await Blog.findByIdAndUpdate(
      blogId,
      {
        /*
         * the $pull operator is used to remove elements from an array that match a specific condition
         * The $pull operator is used to remove the element loginUserId from the dislikes array field
         */
        $pull: { dislikes: loginUserId },
        isDisliked: false,
      },
      { new: true }
    );
    res.json(blog);
  }
  if (isLiked) {
    /* if use already liked,once he/she clicks the like btn again remove the
     * user id frm he likes field N make isLiked false
     * just like on youtube or twitter or etc
     */
    const blog = await Blog.findByIdAndUpdate(
      blogId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      { new: true }
    );
    res.json(blog);
  } else {
    const blog = await Blog.findByIdAndUpdate(
      blogId,
      {
        /* else if it's d 1st time of like and hasn't disliked before
         * set the user id to likes field and set the liked field in blog.likes to true
         * $push, add to the end of the array
         */
        $push: { likes: loginUserId },
        isLiked: true,
      },
      { new: true }
    );
    res.json(blog);
  }
});

const disliketheBlog = asyncHandler(async (req, res) => {
  const { blogId } = req.body;
  validateMongoDbId(blogId);
  // Find the blog which you want to be liked
  const blog = await Blog.findById(blogId);
  // find the login user
  const loginUserId = req?.user?._id;
  // find if the user has liked the blog
  const isDisLiked = blog?.isDisliked;
  // find if the user has disliked the blog
  const alreadyLiked = blog?.likes?.find(
    // in the dislikes field serch the userId.toString to see if the logged in user id is on the list/array
    (userId) => userId?.toString() === loginUserId?.toString()
  );
  if (alreadyLiked) {
    const blog = await Blog.findByIdAndUpdate(
      blogId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      { new: true }
    );
    res.json(blog);
  }
  if (isDisLiked) {
    const blog = await Blog.findByIdAndUpdate(
      blogId,
      {
        $pull: { dislikes: loginUserId },
        isDisliked: false,
      },
      { new: true }
    );
    res.json(blog);
  } else {
    const blog = await Blog.findByIdAndUpdate(
      blogId,
      {
        $push: { dislikes: loginUserId },
        isDisliked: true,
      },
      { new: true }
    );
    res.json(blog);
  }
});

const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const uploader = (path) => cloudinaryUploadImg(path, "images");
    const urls = [];
    const files = req.files;
    for (const file of files) {
      const { path } = file;
      const newpath = await uploader(path);
      console.log(newpath);
      urls.push(newpath);
      fs.unlinkSync(path); // delting the file(s) frm the pulic/images/blogs after saving
    }
    const findBlog = await Blog.findByIdAndUpdate(
      id,
      {
        images: urls.map((file) => {
          return file;
        }),
      },
      {
        new: true,
      }
    );
    res.json(findBlog);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  createBlog,
  updateBlog,
  getBlog,
  getAllBlogs,
  deleteBlog,
  liketheBlog,
  disliketheBlog,
  uploadImages,
};
