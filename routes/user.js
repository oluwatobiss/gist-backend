const { Router } = require("express");
const controller = require("../controllers/user");
const middleware = require("../middlewares/authentication");
const router = Router();

router.get("/", middleware.authenticateUser, controller.getUsers);
router.post("/", controller.createUser);
router.put("/:username", middleware.authenticateUser, controller.updateUser);
router.delete("/:username", middleware.authenticateUser, controller.deleteUser);

module.exports = router;
