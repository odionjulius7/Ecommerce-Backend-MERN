const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcrypt");
const crypto = require("crypto");
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      select: true,
    },
    role: {
      type: String,
      default: "user",
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },
    cart: {
      type: Array,
      default: [],
    },

    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    refreshToken: {
      type: String,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

// By using references and the populate() method in Mongoose, you can fetch associated data from other collections based on the references stored in the fields.

// hash password before saving automatically
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next(); // tis only runs if you the pass hasn't been hashed
  }
  const salt = await bcrypt.genSaltSync(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password before Login, or changing password
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/*
 * method to set resetToken with Crypto library
 * setup the expiration
 */
userSchema.methods.createPasswordResetToken = async function () {
  const resettoken = crypto.randomBytes(32).toString("hex");
  // crypto used to generate and has the resetToken
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resettoken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 10 minutes
  return resettoken;
};

//Export the model
module.exports = mongoose.model("User", userSchema);
