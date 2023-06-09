const jwt = require("jsonwebtoken");

// refresh token generatio ith jwt
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "3d" });
};

module.exports = { generateRefreshToken };
