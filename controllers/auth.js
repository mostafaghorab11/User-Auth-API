const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/user");
const { catchAsync } = require("../util/catchAsync");
const AppError = require("../util/appError");
const sendEmail = require("../util/email");

const generateTokens = (userId) => {
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

const signup = catchAsync(async (req, res, next) => {
  // const { username, email, password } = req.body;

  const user = new User(req.body);

  const savedUser = await user.save();

  const { accessToken, refreshToken } = generateTokens(savedUser._id);

  res.status(201).json({
    message: "User created successfully",
    user: savedUser,
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Please enter email and password", 400);
  }
  const user = await User.findOne({ email: email });
  if (user) {
    const isMatch = await user.comparePassword(password);
    if (isMatch) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      res.status(200).json({
        message: "Login successful",
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } else {
      throw new AppError("Invalid email or password", 401);
    }
  } else {
    throw new AppError("Invalid email or password", 401);
  }
});

const forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Email not found", 404);
  }
  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `http://localhost:3000/api/v1/reset-password/${resetToken}`; // Replace with your frontend reset password URL

  await sendEmail({
    email: email,
    subject: "Password Reset Request",
    message: `
      <p>You requested a password reset for your account.</p>
      <p>Click this link to reset your password within 1 hour:</p>
      <a href="${resetUrl}">Reset Password</a>
    `,
  });

  res.json({ message: "Password reset instructions sent to your email" });
});

const resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });
  if (!user) {
    throw new AppError("Invalid or expired reset token", 401);
  }

  user.password = password;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
});

const refresh = catchAsync(async (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    throw new AppError("Missing refresh token", 400);
  }
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET_KEY + "refresh"
    );
    const user = await User.findById(decoded.userId);
    // Fetch user from database
    if (user) {
      const { accessToken } = generateTokens(user._id);
      // Generate new access and refresh tokens
      return res.json({ accessToken: accessToken });
    }
  } catch (err) {
    throw new AppError("Invalid refresh token", 401);
  }
});

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
