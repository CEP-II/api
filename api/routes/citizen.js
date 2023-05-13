const express = require("express");
const router = express.Router();

const authorizeRoles = require("../middleware/authorizeRoles");

const CitizenController = require("../controller/citizen");

// Sign-up and sign-in. Since we dont store information (stateless), we don't need to log the user out (we can't do this)
router.post("/signup", CitizenController.signup);

router.post("/login", CitizenController.login);

router.delete(
  "/:citizenId",
  authorizeRoles(["admin"]),
  CitizenController.delete
); // any user logged in can currently delete any other user...

router.get("/", authorizeRoles(["admin"]), CitizenController.get_all_citizens);

router.get(
  "/:citizenId",
  authorizeRoles(["admin"]),
  CitizenController.get_citizen
);

router.patch(
  "/:citizenId",
  authorizeRoles(["admin"]),
  CitizenController.patch_citizen
);

module.exports = router;
