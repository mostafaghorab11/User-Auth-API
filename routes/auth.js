const express = require("express");
const { login, signup } = require("../controllers/auth");

const router = express.Router();

router.route("/signup").get().post(signup);
router.route("/login").get().post(login);

module.exports = router;
