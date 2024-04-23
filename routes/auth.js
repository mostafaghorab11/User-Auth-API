const express = require("express");
const { login, signup, dashboard } = require("../controllers/auth");

const jwtPassport = require("../config/jwt-passport");
const googlePassport = require("../config/google-passport");

const router = express.Router();

router.route("/signup").get().post(signup);
router.route("/login").get().post(login);
router
  .route("/dashboard")
  .get(jwtPassport.authenticate("jwt", { session: false }), dashboard);

router.get(
  "/login/google",
  googlePassport.authenticate("google", { scope: ["profile", "email"] }),
  dashboard
); // Request Google profile and email

module.exports = router;
