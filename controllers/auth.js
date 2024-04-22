const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/user");
const handleValidationError = require("../errors/validation-error");
const passport = require("../config/passport");

const signup = async (req, res, next) => {
  // console.log(req.body);
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Please enter a username, email and password" });
    }

    const user = new User({
      username,
      email,
      password,
    });

    // check if there's user with the same username or email
    const existingUser = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });
    if (existingUser) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "User already exists" });
    }

    const savedUser = await user.save();

    // Generate JWT upon successful signup
    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "30d",
    });

    res.status(201).json({
      message: "User created successfully",
      user: savedUser,
      token: token,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const formattedErrors = handleValidationError(error);
      res.status(StatusCodes.BAD_REQUEST).json(formattedErrors);
    } else {
      // Handle other errors (e.g., database errors)
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Please enter an email and password" });
  }
  const user = await User.findOne({ email: email });
  if(user) {
    const isMatch = await user.comparePassword(password);
    if(isMatch) {
      const payload = { userId: user._id };
      const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: "30d",
      });
      res.status(200).json({
        message: "Login successful",
        token: token,
      });
    } else {
      res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid email or password",
      });
    }
  } else {
    res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Invalid email or password",
    });
  }
};

const dashboard = (req, res) => {
  const luckyNumber = Math.floor(Math.random() * 100);

  res.status(200).json({
    msg: `Hello, ${req.user.username}`,
    secret: `Here is your authorized data, your lucky number is ${luckyNumber}`,
  });
};

module.exports = { signup, login, dashboard };
