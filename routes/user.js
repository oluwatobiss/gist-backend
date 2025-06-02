const { Router } = require("express");
const controller = require("../controllers/user");
const router = Router();

router.get("/", controller.getUsers);
router.post("/", controller.createUser);
router.delete("/:id", controller.deleteUser);

module.exports = router;
