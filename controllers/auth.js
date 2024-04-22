const { StatusCodes } = require("http-status-codes");
const User = require("../models/user");
const handleValidationError = require("../errors/validation-error");

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
    res
      .status(201)
      .json({ message: "User created successfully", user: savedUser });
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

const login = (req, res, next) => {
  res.status(200).json({
    message: "login successful",
  });
};

module.exports = { signup, login };
