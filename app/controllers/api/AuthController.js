const argon2 = require("argon2");
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
    console.error(err);
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
};
