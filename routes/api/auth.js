const router = require("express").Router();

// Controllers
const {
  register,
  verify,
  login,
  resendVerification,
} = require("../../app/controllers/api/AuthController");

// Middleware
const {
  registerValidation,
  loginValidation,
} = require("../../app/middlewares/auth");

// Authentication Routes
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);

// Verification Routes
router.get("/verify/:token", verify);
router.post("/verify/resend", resendVerification);

module.exports = router;
