const { Router } = require("express");
const controller = require("../controllers/channel");
const router = Router();

router.post("/", controller.createChannel);

module.exports = router;
