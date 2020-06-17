const express = require("express");
const router = express.Router();

router.get("/game/room/:id", (req, res) => {
  res.send("XD");
});

module.exports = router;
