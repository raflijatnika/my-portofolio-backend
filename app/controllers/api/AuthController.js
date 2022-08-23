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
 * @description Register New User
 *
 * @method  POST
 * @url api/auth/register
 *
 * @access  public
 *
 */
