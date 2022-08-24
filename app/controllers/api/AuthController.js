const argon2 = require("argon2");
const config = require("config");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const User = require("../../models/User");
const { randomString } = require("../../helpers/common");
const Verification = require("../../models/Verification");
const { success, error, validation } = require("../../helpers/responseApi");

/**
 * @description Register New User
 *
 * @method  POST
 * @url api/auth/register
 *
 * @access  public
 *
 */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json(validation(errors.array()));

  // Request Body
  const { fullName, email, password } = req.body;

  try {
    // Check if email registered
    const emailRegistered = await User.findOne({ email: email.toLowerCase() });

    if (emailRegistered)
      return res
        .status(422)
        .json(validation({ detail: "Email already registered" }));

    const userData = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().replace(/\s+/, "").trim(),
      password,
    });

    // Hash the password
    userData.password = await argon2.hash(password, {
      type: argon2.argon2id,
      hashLength: 100,
    });

    // Save the user
    await userData.save();

    // Save token for user to start verificating the account
    let verification = new Verification({
      token: randomString(200),
      userId: userData._id,
      type: "Register New Account",
    });

    // Save the verification data
    await verification.save();

    // Send the response to server
    res.status(201).json(
      success(
        "Register success, please activate your account.",
        {
          user: {
            id: userData._id,
            fullName: userData.fullName,
            email: userData.email,
            verified: userData.verified,
            verifiedAt: userData.verifiedAt,
            createdAt: userData.createdAt,
          },
          verification,
        },
        res.statusCode
      )
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json(error("Internal Server Error", res.statusCode));
  }
};

/**
 * @description Verify User
 *
 * @method GET
 * @url api/auth/verify/:token
 *
 * @access  public
 *
 */
exports.verify = async (req, res) => {
  // Token From Params
  const { token } = req.params;

  try {
    let verifyData = await Verification.findOne({
      token,
      type: "Register New Account",
    });

    if (!verifyData) {
      return res
        .status(400)
        .json(error("Verification data not found", res.statusCode));
    }

    let userData = await User.findOne({ _id: verifyData.userId }).select(
      "-password"
    );

    userData = await User.findByIdAndUpdate(userData._id, {
      $set: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    // Remove verification data after succes verify
    verifyData = await Verification.findOneAndRemove(verifyData._id);

    // Response
    res
      .status(200)
      .json(
        success(
          "Your successfully verificating your account",
          null,
          res.statusCode
        )
      );
  } catch (err) {
    console.error(err.message);
    res.status(500).json(error("Internal Server Error", res.statusCode));
  }
};

/**
 * @description Login User
 *
 * @method POST
 * @url api/auth/login
 *
 * @access  public
 *
 */
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(validation(errors.array()));
  }

  const { email, password } = req.body;

  try {
    // Find user data
    const userData = await User.findOne({ email });

    // If user with body email not found throw error
    if (!userData)
      return res.status(422).json(validation("Invalid Email or Password"));

    // Check & validate user password
    const checkPassword = await argon2.verify(userData.password, password);

    // If password incorrect
    if (!checkPassword)
      return res.status(422).json(validation("Invalid Email or Password"));

    // Check user verified or not
    if (userData && !userData.verified)
      return res
        .status(400)
        .json(
          error("Please verify your account before log in", res.statusCode)
        );

    // Execute if validation above pass
    const response = {
      user: {
        id: userData._id,
        fullName: userData.fullName,
        email: userData.email,
      },
    };

    jwt.sign(
      response,
      config.get("jwtSecret"),
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;

        res
          .status(200)
          .json(success("Login Success", { token }, res.statusCode));
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json(error("Internal Server Error", res.statusCode));
  }
};

/**
 * @description Resend Verification User
 *
 * @method POST
 * @url api/auth/verify/resend
 *
 * @access  public
 *
 */
exports.resendVerification = async (req, res) => {
  // Request Body
  const { email } = req.body;

  // Validation For Email
  if (!email)
    return res.status(422).json(validation({ message: "Email is required" }));

  try {
    // Find user data by email
    const userData = await User.findOne({ email: email.toLowerCase() });

    // If user not found
    if (!userData)
      return res.status(404).json(error("Email not found", res.statusCode));

    // Find user by userId
    let verification = await Verification.findOne({
      userId: userData._id,
      type: "Register new aaccount",
    });

    // If verification data found
    if (verification) {
      verification = await Verification.findByIdAndRemove(verification._id);
    }

    // Create a new verification data
    let newVerification = new Verification({
      token: randomString(200),
      userId: userData._id,
      type: "Register New Account",
    });

    // Save new verification data
    await newVerification.save();

    // Send response
    res
      .status(201)
      .json(
        success(
          "Verification has been sent",
          { verification: newVerification },
          res.statusCode
        )
      );
  } catch (err) {
    console.error(err.message);
    res.status(500).json(error("Internal Server Error", res.statusCode));
  }
};
