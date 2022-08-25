const config = require("config");
const jwt = require("jsonwebtoken");
const { check } = require("express-validator");
const { error } = require("../helpers/responseApi");

// Register Validation
exports.registerValidation = [
  check("fullName", "Full Name is required").not().isEmpty(),
  check("email", "Email is required").not().isEmpty(),
  check("email", "Please enter valid email").isEmail(),
  check("password", "Password is required").not().isEmpty(),
];

// Login Validation
exports.loginValidation = [
  check("email", "Email is required").notEmpty(),
  check("email", "Please enter valid email").isEmail(),
  check("password", "Password is required").notEmpty(),
];

/**
 * Get authenticated user data from JWT
 */
exports.auth = async (req, res, next) => {
  // Get Authorization header
  const authorizationHeader = req.header("Authorization");

  // Split the authorization header value
  const splitAuthorizationHeader = authorizationHeader.split(" ");

  // Get type of token and the token
  const tokenType = splitAuthorizationHeader[0];
  const token = splitAuthorizationHeader[1];

  // Check token type
  if (tokenType !== "Bearer")
    return res
      .status(400)
      .json(error("Type of token must be a Bearer", res.statusCode));

  // Check token
  if (!token)
    return res.status(404).json(error("No token found", res.statusCode));

  try {
    // Verify JWT Token
    const jwtData = await jwt.verify(token, config.get("jwtSecret"));

    // Check JWT token
    if (!jwtData)
      return res.status(401).json(error("Unauthorized User", res.statusCode));

    // If JWT verify valid
    req.user = jwtData.user;

    // Continue to next action
    next();
  } catch (err) {
    console.error(err.message);
    return res.status(401).json(error("Unauthorized User", res.statusCode));
  }
};
