const mongoose = require("mongoose");
require("dotenv").config();

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("Uncaught Exception ... Shutting down ...");
  server.close(() => {
    process.exit(1);
  });
});

const app = require("./app");

const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Connected to MongoDB");
});
const server = app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled rejection ... Shutting down ...");
  server.close(() => {
    process.exit(1);
  });
});
