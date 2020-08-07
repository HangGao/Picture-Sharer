const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password").exec();
  } catch (err) {
    const error = new HttpError(
      "Could not retrieve users, please try again later.",
      500
    );
    return next(error);
  }

  res.json({ users: users.map((u) => u.toObject({ getters: true })) });
};

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid inputs passed. Please check your data.",
      422
    );
    return next(error);
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email }).exec();
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  let newUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });
  console.log(newUser);

  try {
    await newUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Signing Up failed, please try again.", 422);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Signing Up failed, please try again.", 500);
    return next(error);
  }

  res
    .status(200)
    .json({ userId: newUser.id, email: newUser.email, token: token });
};

const logIn = async (req, res, next) => {
  const { email, password } = req.body;

  let identifiedUser;
  try {
    identifiedUser = await User.findOne({ email: email }).exec();
  } catch (err) {
    const error = new HttpError(
      "Logging In failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!identifiedUser) {
    const error = new HttpError(
      "Could not identify user, credentials seem to be wrong.",
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, identifiedUser.password);
    if (!isValidPassword) {
      throw new Error("Invalid password");
    }
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: identifiedUser.id, email: identifiedUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Logging In failed, please try again.", 500);
    return next(error);
  }

  res
    .status(200)
    .json({
      userId: identifiedUser.id,
      email: identifiedUser.email,
      token: token,
    });
};

exports.getAllUsers = getAllUsers;
exports.signUp = signUp;
exports.logIn = logIn;
