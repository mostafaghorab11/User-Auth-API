const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/user");
const handleValidationError = require("../errors/validation-error");

const generateTokens = async (userId) => {
  const payload = { userId: userId };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: "30m",
  });
  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_SECRET_KEY + "refresh",
    { expiresIn: "15d" }
  );

  return { accessToken, refreshToken };
};

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

    const { accessToken, refreshToken } = await generateTokens(savedUser._id);

    res.status(201).json({
      message: "User created successfully",
      user: savedUser,
      accessToken: accessToken,
      refreshToken: refreshToken,
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
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Please enter an email and password" });
    }
    const user = await User.findOne({ email: email });
    if (user) {
      const isMatch = await user.comparePassword(password);
      if (isMatch) {
        const { accessToken, refreshToken } = await generateTokens(user._id);
        res.status(200).json({
          message: "Login successful",
          accessToken: accessToken,
          refreshToken: refreshToken,
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

const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email not found" });
    }

    // Generate a random reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Create a transporter for sending emails
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: "vetghorab@gmail.com",
        //through app passwords in security in google settings
        pass: process.env.GOOGLE_PASSWORD,
      },
    });

    const resetUrl = `http://localhost:3000/api/v1/reset-password/${resetToken}`; // Replace with your frontend reset password URL

    const mailOptions = {
      from: "vetghorab@gmail.com", // Replace with your email address
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset for your account.</p>
        <p>Click this link to reset your password within 1 hour:</p>
        <a href="${resetUrl}">Reset Password</a>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Password reset instructions sent to your email" });
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server Error" });
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Please enter a password" });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
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

const refresh = async (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ message: "Missing refresh token" });
  }
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET_KEY + "refresh"
    ); // Verify refresh token
    const user = await User.findById(decoded.userId); // Fetch user from database
    console.log(user.id);
    if (user) {
      const { accessToken } = await generateTokens(user._id); // Generate new access and refresh tokens
      return res.json({ accessToken: accessToken });
    } else {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

const dashboard = (req, res) => {
  const luckyNumber = Math.floor(Math.random() * 100);

  res.status(200).json({
    msg: `Hello, ${req.user.username}`,
    secret: `Here is your authorized data, your lucky number is ${luckyNumber}`,
  });
};

module.exports = {
  generateTokens,
  signup,
  login,
  dashboard,
  forgetPassword,
  resetPassword,
  refresh,
};
