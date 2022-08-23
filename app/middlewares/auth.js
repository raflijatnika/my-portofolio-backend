const { check } = require("express-validator");

exports.registerValidation = [
  check("fullName", "Full Name is required").not().isEmpty(),
  check("email", "Email is required").not().isEmpty(),
  check("email", "Please enter valid email").isEmail(),
  check("password", "Password is required").not().isEmpty(),
];

exports.loginValidation = [
  check("email", "Email is required").notEmpty(),
  check("email", "Please enter valid email").isEmail(),
  check("password", "Password is required").notEmpty(),
];
