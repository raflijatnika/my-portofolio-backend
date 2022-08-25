const router = require("express").Router();

// Controllers
const {
  login,
  verify,
  register,
  resendVerification,
  getAuthenticatedUser,
} = require("../../app/controllers/api/AuthController");

// Middleware
const {
  auth,
  loginValidation,
  registerValidation,
} = require("../../app/middlewares/auth");

// Authentication Routes
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);

// Verification Routes
router.get("/verify/:token", verify);
router.post("/verify/resend", resendVerification);

// Users Route
router.get("/user", auth, getAuthenticatedUser);

module.exports = router;
