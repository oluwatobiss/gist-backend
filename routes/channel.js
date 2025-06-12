const { Router } = require("express");
const controller = require("../controllers/channel");
const router = Router();

router.get("/", controller.getChannels);
router.post("/", controller.createChannel);
router.post("/:channelId/users/:username", controller.subscribeToChannel);
router.put("/:id", controller.updateChannel);
router.delete("/:id", controller.deleteChannel);

module.exports = router;
