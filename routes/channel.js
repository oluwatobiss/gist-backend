const { Router } = require("express");
const controller = require("../controllers/channel");
const middleware = require("../middlewares/authentication");
const router = Router();

router.get("/", middleware.authenticateUser, controller.getChannels);
router.post("/", middleware.authenticateUser, controller.createChannel);
router.post(
  "/:channelId/users/:username",
  middleware.authenticateUser,
  controller.subscribeToChannel
);
router.put("/:id", middleware.authenticateUser, controller.updateChannel);
router.delete("/:id", middleware.authenticateUser, controller.deleteChannel);
router.delete(
  "/:channelId/users/:username",
  middleware.authenticateUser,
  controller.unsubscribeFromChannel
);

module.exports = router;
