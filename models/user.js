const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (value) => validator.isEmail(value),
      message: "Invalid email address",
    },
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
  },
});

userSchema.pre("save", async function (next) {
  const user = this;

  if (!user.isModified("password")) {
    return next();
  }

  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);

  const hash = await bcrypt.hash(user.password, salt);

  user.password = hash;

  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  const user = this;
  return await bcrypt.compare(candidatePassword, user.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
