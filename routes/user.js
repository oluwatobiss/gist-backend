const { Router } = require("express");
const controller = require("../controllers/user");
const router = Router();

router.get("/", controller.getUsers);
router.post("/", controller.createUser);
router.put("/:username", controller.updateUser);
router.delete("/:username", controller.deleteUser);

module.exports = router;
