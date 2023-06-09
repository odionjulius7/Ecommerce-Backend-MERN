const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers?.authorization.split(" ")[1];
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded?.id); // the id from the (decoded)token match d use in our db
        req.user = user; // then pass that to the req.user ptoperty
        next(); // go to the next method
        // console.log(req.user);
      } else {
        throw new Error("Not Authorized, please login again");
      }
    } catch (error) {
      throw new Error("Not Authorized, please login again");
    }
  } else {
    throw new Error("There's no token attached to the header");
  }
});

const isAdmin = asyncHandler(async (req, res, next) => {
  // get the user email from the decoded token(authMiddleware) that was usd to get the user details
  const { email } = req.user;
  const adminUser = await User.findOne({ email: email });
  if (adminUser.role !== "admin") {
    throw new Error("Not An Admin!");
  } else {
    next(); // else go to the next method(control method)
  }
});

module.exports = { authMiddleware, isAdmin };
