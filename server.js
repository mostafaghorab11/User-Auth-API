const express = require("express");
require("dotenv").config();
const session = require('express-session');

const router = require("./routes/auth");
const connectDB = require("./db/connect");
const notFoundMiddleware = require("./middleware/not-found.js");

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // Set to true if using HTTPS only
}));
app.use(express.json()); // to handle req.body
app.use("/api/v1", router);

app.use(notFoundMiddleware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    app.listen(port, () => {
      console.log(`Server is listening at http://localhost:${port}`);
    });
  } catch (err) {
    console.log(err);
  }
};

start();
