const mongoose = require("mongoose");

const connectDB = (url) => {
  mongoose
    .connect(url)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => console.error("Database connection error", err));
};

module.exports = connectDB;
