const express = require("express");
const router = express.Router();

const accidentController = require("../controller/accident");
const authorizeRoles = require("../middleware/authorizeRoles");

router.post("/", accidentController.report_accident);

router.get(
  "/",
  authorizeRoles(["admin"]),
  accidentController.get_all_accidents
);

router.delete(
  "/:accidentId",
  authorizeRoles(["admin"]),
  accidentController.delete_accident_by_id
);

module.exports = router;
