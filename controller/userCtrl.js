const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const uniqid = require("uniqid");

// express-async-handler is a middleware for Express.js that simplifies error handling for asynchronous route handlers. It helps in handling errors that occur within asynchronous functions or promise-based operations and automatically catches and forwards those errors to the Express error-handling middleware.
const asyncHandler = require("express-async-handler");

//
const { generateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshtoken");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");

// Create a User ----------------------------------------------

const createUser2 = asyncHandler(async (req, res) => {
  /**
   * TODO:Get the email from req.body
   */
  const email = req.body.email;
  /**
   * TODO:With the help of email find the user exists or not
   */
  const findUser = await User.findOne({ email: email });

  if (!findUser) {
    /**
     * TODO:if user not found user create a new user
     */
    const newUser = await User.create(req.body);
    res.json(newUser);
  } else {
    /**
     * TODO:if user found then thow an error: User already exists
     */
    throw new Error("User Already Exists");
  }
});

//
const createUser = asyncHandler(async (req, res) => {
  /**
   * TODO:Get the email from req.body
   */
  const email = req.body.email;
  /**
   * TODO:With the help of email find the user exists or not
   */
  const findUser = await User.findOne({ email: email });

  if (!findUser) {
    /**
     * TODO:if user not found user create a new user
     */
    const newUser = await User.create(req.body);
    res.json(newUser);
  } else {
    /**
     * TODO:if user found then thow an error: User already exists
     */
    throw new Error("User Already Exists");
  }
});

// Login a user
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findUser = await User.findOne({ email });
  if (!findUser)
    throw new Error(`User with  this email: ${email} doesn't exist`);
  if (findUser && (await findUser.isPasswordMatched(password))) {
    /*
     * when logging in user generate a refresh token and update the collection field with it
     */
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await User.findByIdAndUpdate(
      findUser.id,
      {
        /*
         * update the user with the generated refresh token
         */
        refreshToken: refreshToken,
      },
      { new: true }
    );
    /*
     * after storing the refreshtoken in the db, setup the res.cookie()
     */
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findUser?._id,
      firstname: findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// admin login
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findAdmin = await User.findOne({ email });
  if (findAdmin.role !== "admin") throw new Error("Not Authorised");
  if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findAdmin?._id);
    const updateuser = await User.findByIdAndUpdate(
      findAdmin.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    // persisting the refreshToken in res.cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findAdmin?._id,
      firstname: findAdmin?.firstname,
      lastname: findAdmin?.lastname,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      token: generateToken(findAdmin?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
  /*
   * check login to see how we got the req.cookies(setup)
   */
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");

  /*
   * pass the refreshToken from req.cookies to this variable
   */
  const refreshToken = cookie.refreshToken;

  /*
   * use it to get the user(in the User model) that the refreshToken matches
   */
  const user = await User.findOne({ refreshToken });

  if (!user) throw new Error(" No Refresh token present in db or not matched");

  /*
   * if the user exist, verify the refreshToken authenticity
   */
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
});

// logout functionality
const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    /*
     *
     */
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); // forbidden
  }
  await User.findOneAndUpdate(
    { refreshToken: refreshToken },
    {
      refreshToken: "",
    }
  );
  /*
   *
   */
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); // forbidden
});

// Update a user

const updatedUser = asyncHandler(async (req, res) => {
  // instead of updating using id from router, user the id gotten from the req.user (authMiddleware)
  const { id } = req.user;
  // const _id = req.params.id;
  validateMongoDbId(id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        firstname: req?.body?.firstname,
        lastname: req?.body?.lastname,
        email: req?.body?.email,
        mobile: req?.body?.mobile,
      },
      {
        new: true, // return the new updated data
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

// save user Address

const saveAddress = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        address: req?.body?.address,
      },
      {
        new: true,
      }
    ).select("+address");
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

// Get all users

const getallUser = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find().populate("wishlist");
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});

// Get a single user

const getaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const getaUser = await User.findById(id).select("-password");
    res.json({
      getaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Get a single user

const deleteaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const deleteaUser = await User.findByIdAndDelete(id);
    res.json({
      msg: "succssfully deleted user",
      deleteaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const blockusr = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    );
    res.json(blockusr);
  } catch (error) {
    throw new Error(error);
  }
});

const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const unblock = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    );
    res.json({
      message: "User UnBlocked",
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongoDbId(_id);
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json(updatedPassword);
  } else {
    res.json(user);
  }
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found with this email");
  try {
    const token = await user.createPasswordResetToken(); //Tis generates the resetToken and expiration date in User model
    await user.save();
    const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:5000/api/user/reset-password/${token}'>Click Here<a/>`;
    const data = {
      to: email,
      text: "Hey User",
      subject: "Forgot Password Link",
      htm: resetURL,
    };
    sendEmail(data); // using nodemailer
    res.json(token);
  } catch (error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  /*
   * get the reset token frm the route params
   * hash the token
   */
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    /*
     *find the user with both the hashed ResetToken and the passwordResetExpires date
     * if passwordResetExpires is greater than the present time, get the user
     * else if less than passwordResetExpires has expired ({ $gt: Date.now() })
     */
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, //if it greater dan the currnt date then it's in the future
  });
  if (!user) throw new Error(" Token Expired, Please try again later");
  user.password = password; // before saving the model automatical hash with the method we set
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json(user);
});

const getWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const findUser = await User.findById(_id).populate("wishlist");
    res.json(findUser);
  } catch (error) {
    throw new Error(error);
  }
});

const userCart = asyncHandler(async (req, res) => {
  const { cart } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    // It initializes an empty array called products to store d user cart products.
    let products = [];
    const user = await User.findById(_id);
    /*
     *The provided code snippet is attempting to find a cart item using the Cart model
     *and the orderby field. If a matching cart item is found,
     *it is removed from the database using the remove() method.
     */
    const alreadyExistCart = await Cart.findOne({ orderby: user._id });
    if (alreadyExistCart) {
      // The recommended approach is to use the deleteOne() or findOneAndDelete() methods instead.
      // alreadyExistCart.remove(); deprecated in latest mongoose
      await Cart.deleteOne({ _id: alreadyExistCart._id });
    }
    for (let i = 0; i < cart.length; i++) {
      let object = {};
      /* It iterates over each item in the cart array using a for loop.
       * Inside the loop, it creates an object and assigns values to its properties
       * based on the corresponding values from the current cart item.
       */
      object.product = cart[i]._id;
      object.count = cart[i].count;
      object.color = cart[i].color;
      /*
       *It uses the Product model and findById() method to retrieve the
       *price of the product associated with the current cart item being looped thru.
       */
      let getPrice = await Product.findById(cart[i]._id).select("price").exec();
      object.price = getPrice.price;
      /*
       *It pushes the object into the products array.
       */
      products.push(object);
    }

    /*
     * The provided code calculates the cartTotal by iterating over the products array
     * and multiplying the price of each product by its count, and then summing up the results.
     */
    let cartTotal = 0;
    for (let i = 0; i < products.length; i++) {
      cartTotal = cartTotal + products[i].price * products[i].count;
    }

    /*
     * It creates a new cart object using the Cart model and assigns the
     * products, cartTotal, and orderby properties before saving to d db.
     */
    let newCart = await new Cart({
      products,
      cartTotal,
      orderby: user?._id,
    }).save();
    res.json(newCart);
  } catch (error) {
    throw new Error(error);
  }
});

const getUserCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    // find the user's cart where the user id matches the cart.orderby id
    const cart = await Cart.findOne({ orderby: _id }).populate(
      "products.product"
      // populate each prroduct in d products array(by the product id)
    );
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

const emptyCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const user = await User.findOne({ _id }); // find user
    // find the cart by orderby where it matches the user id and remove
    const cart = await Cart.findOneAndRemove({ orderby: user._id });
    res.json({
      msg: "User cart delete",
      cart,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { coupon } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  const validCoupon = await Coupon.findOne({ name: coupon });
  if (validCoupon === null) {
    // check to see if the coupon inputted/provided is an invalid coupon code/name
    throw new Error("Invalid Coupon");
  }

  const user = await User.findOne({ _id });

  // find the user cart and destructure cartTotal from it
  let { cartTotal } = await Cart.findOne({
    orderby: user._id,
  }).populate("products.product");

  // getting total after discount-// minus the the coupon discount(price) from carTotal
  let totalAfterDiscount = (
    cartTotal -
    (cartTotal * validCoupon.discount) / 100
  ) // the discount of the total price
    .toFixed(2);
  await Cart.findOneAndUpdate(
    { orderby: user._id },
    { totalAfterDiscount },
    { new: true }
  );
  res.json(totalAfterDiscount);
});

const createOrder = asyncHandler(async (req, res) => {
  // COD cash on delivery
  const { COD, couponApplied } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    // if no COD throw new error
    if (!COD) throw new Error("Create cash order failed");
    // else find user
    const user = await User.findById(_id);
    // the user cart details (object)
    let userCart = await Cart.findOne({ orderby: user._id });
    let finalAmout = 0; // initial order amount
    if (couponApplied && userCart.totalAfterDiscount) {
      /*
       *if coupon name(couponApplied) and the user cart total amt after discount
       * is available the order final amount = userCart.totalAfterDiscount
       */
      finalAmout = userCart.totalAfterDiscount;
    } else {
      // else five it the user cart total amount
      finalAmout = userCart.cartTotal;
    }

    // create order model for the user
    let newOrder = await new Order({
      products: userCart.products,
      paymentIntent: {
        id: uniqid(), // to generate unique id
        method: "COD", // cash On Delivery
        amount: finalAmout,
        status: "Cash on Delivery",
        created: Date.now(),
        currency: "usd",
      },
      orderby: user._id,
      orderStatus: "Cash on Delivery",
    }).save();

    /*
     * after the order make sure to update the that product count(Product Model)
     * and also the sold property(of Product Model) to reflect the product(s) count sold
     */
    let update = userCart.products.map((item) => {
      /*
       * The userCart.products.map() function iterates over each item in the
       * userCart.products array.For each item, it returns an object with an updateOne property.
       */
      return {
        updateOne: {
          /*
           * The filter property specifies the query filter to match the product with its _id value.
           * The update property uses the $inc operator to increment the sold field by item.count
           * and decrement the quantity field by item.count.
           */
          filter: { _id: item.product._id },
          update: { $inc: { quantity: -item.count, sold: +item.count } },
        },
      };
    });

    /*
     * After generating the update array, the code proceeds to perform the bulk write operation
     * using Product.bulkWrite(), The Product.bulkWrite() method is called with the update array and
     * an empty object {} as options. The method executes the bulk write operation, which applies
     * the specified update operations to the Product collection. By using Product.bulkWrite(), multiple
     * update operations can be executed efficiently in a single database operation
     */
    const updated = await Product.bulkWrite(update, {});
    res.json({ message: "success", newOrder });
  } catch (error) {
    throw new Error(error);
  }
}); // Note: just like looping through the products to make changes based on the ones sold in making order

// User getting own orders[arrays]
const getOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const userorders = await Order.findOne({ orderby: _id })
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});

// By admin
const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const alluserorders = await Order.find()
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(alluserorders);
  } catch (error) {
    throw new Error(error);
  }
});

// By admin
const getOrderByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const userorders = await Order.findOne({ orderby: id })
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});

// only admin can update order status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params; // order id
  validateMongoDbId(id);
  try {
    // update the user order status
    const updateOrderStatus = await Order.findByIdAndUpdate(
      id,
      {
        orderStatus: status,
        paymentIntent: {
          // and also the status of the paymentIntent object prop
          status: status,
        },
      },
      { new: true }
    );
    res.json(updateOrderStatus);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
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
};
