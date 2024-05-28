const express = require("express");
require("dotenv").config();
const session = require("express-session");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require('express-mongo-sanitize');

const router = require("./routes/auth");
const connectDB = require("./db/connect");
const notFoundMiddleware = require("./middleware/not-found.js");
const { globalErrorsHandler } = require("./controllers/errorController.js");

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("Uncaught Exception ... Shutting down ...");
  server.close(() => {
    process.exit(1);
  });
});

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json()); // to handle req.body

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS only
  })
);
}

app.use(mongoSanitize());

app.use("/api/v1", router);

app.use(notFoundMiddleware);
app.use(globalErrorsHandler);

let server;

const start = () => {
  connectDB(process.env.MONGO_URI);
  server = app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
  });
};

start();

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled rejection ... Shutting down ...");
  server.close(() => {
    process.exit(1);
  });
});
