const express = require("express");
const { login, signup, dashboard } = require("../controllers/auth");

const passport = require('../config/passport');

const router = express.Router();

router.route("/signup").get().post(signup);
router.route("/login").get().post(login);
router
  .route("/dashboard")
  .get(passport.authenticate("jwt", { session: false }), dashboard);

module.exports = router;
