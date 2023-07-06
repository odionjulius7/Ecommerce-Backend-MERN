const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");
const { cloudinaryUploadImg } = require("../utils/cloudinary");
const fs = require("fs");

const createProduct = asyncHandler(async (req, res) => {
  try {
    if (req.body.title) {
      /*   slugify function is commonly used to transform a string into a slug
       *   Converts the string to lowercase.
       *  Removes any non-alphanumeric characters (such as spaces, punctuation, or special characters).
       * eg,  "Hello World! How Are You?" to hello-world-how-are-you
       */
      req.body.slug = slugify(req.body.title);
    }
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    if (req.body.title) {
      /*
       *  on update change the slug value to the latest title value
       * for the url seaarchable
       */
      req.body.slug = slugify(req.body.title);
    }
    const updateProduct = await Product.findOneAndUpdate(
      { _id: id },
      req.body,
      {
        new: true,
      }
    );

    res.json(updateProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deleteProduct = await Product.findOneAndDelete({ _id: id });
    // const deleteProduct2 = await Product.findByIdAndDelete(id);
    res.json({
      msg: "successful",
      deleteProduct,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getaProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const findProduct = await Product.findById(id).populate("color");
    res.json(findProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllProduct = asyncHandler(async (req, res) => {
  try {
    // Filtering products
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"]; // exclude for pagination and others name
    excludeFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    /*
     * gte = greater than or equal to | gt = greater than
     * lte = less than or equal to | lt = less than
     */
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    /*
     * we returning this query variabke to the user end
     * but we sort, limit (select itms to show), pagination if queried by
     *  users and send back the updated/altered query products
     */
    let query = Product.find(JSON.parse(queryStr)).populate("color");

    // Sorting products (A - Z , Highest - lowest) // older - newest
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt"); // don't show this
    }

    /*
     * limiting the fields that you want
     * e.g. brand, prices, and category
     * // always the split(', ').join(' ') multiple items provided to
     * avoid somthing, brand category (brand, category)
     */
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v"); // don't show this
    }

    // pagination
    const page = req.query.page; // page number
    const limit = req.query.limit; // items per page
    /*
     *  skipping items, at first it won't skip any, cos page = 1
     * but on subsequent it will skip items from the 1st and so on
     * if, limit(items) is 3 and page = 1, skip will = 0
     * but limit 3 , page 2 then it will skip the first 3(items) and so on
     */
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (req.query.page) {
      // just getting Product count for the if logic
      const productCount = await Product.countDocuments();
      if (skip >= productCount) throw new Error("This Page does not exists");
    }
    const product = await query;
    res.json(product);
  } catch (error) {
    throw new Error(error);
  }
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { prodId } = req.body;
  try {
    const user = await User.findById(_id);

    // check to see if the user already has the particular product in their wishlist
    const alreadyadded = user.wishlist.find((id) => id.toString() === prodId);

    if (alreadyadded) {
      // if already there update by using mongodb $pull to remove the prod from the user wishlist
      let user = await User.findByIdAndUpdate(
        _id,
        {
          $pull: { wishlist: prodId },
        },
        {
          new: true,
        }
      );
      res.json(user);
    } else {
      // else use $push to add it to the user wishlist
      let user = await User.findByIdAndUpdate(
        _id,
        {
          $push: { wishlist: prodId },
        },
        {
          new: true,
        }
      );
      res.json(user);
    }
  } catch (error) {
    throw new Error(error);
  }
});

const rating = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { star, prodId, comment } = req.body;
  try {
    const product = await Product.findById(prodId);

    /*
    *ratings: [
      {
        star: Number,
        comment: String,
        postedby: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    * search to see if the user already liked the product
    * */
    let alreadyRated = product.ratings.find(
      (userId) => userId.postedby.toString() === _id.toString()
    );
    if (alreadyRated) {
      // if already exist
      const updateRating = await Product.updateOne(
        {
          // just match the userId(postedBy in rating), once it matches
          ratings: { $elemMatch: alreadyRated },
        },
        {
          // then replace/set the new datas (star, comment on that part d userId match the postedBy id)
          $set: { "ratings.$.star": star, "ratings.$.comment": comment },
        },
        {
          new: true,
        }
      );
    } else {
      const rateProduct = await Product.findByIdAndUpdate(
        prodId,
        {
          $push: {
            ratings: {
              star: star,
              comment: comment,
              postedby: _id,
            },
          },
        },
        {
          new: true,
        }
      );
    }
    const getallratings = await Product.findById(prodId);
    let totalRating = getallratings.ratings.length; // the length of ratings

    // loop thru the prod ratings to get the stars, and get the total of the stars(with reduce())
    let ratingsum = getallratings.ratings
      .map((item) => item.star)
      .reduce((prev, curr) => prev + curr, 0);
    let actualRating = Math.round(ratingsum / totalRating); // divid the ratingsum / totalRating to get the prod total rating
    let finalproduct = await Product.findByIdAndUpdate(
      prodId,
      {
        // persist in the db
        totalrating: actualRating,
      },
      { new: true }
    );
    res.json(finalproduct);
  } catch (error) {
    throw new Error(error);
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
      urls.push(newpath);
      fs.unlinkSync(path);
    }

    const findProduct = await Product.findByIdAndUpdate(
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
    res.json(findProduct);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  rating,
  uploadImages,
};
