const { Router } = require("express");
const { PrismaClient } = require("../generated/prisma/client");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const validate = require("../middlewares/validator");
const StreamChat = require("stream-chat").StreamChat;

const router = Router();
const prisma = new PrismaClient();
const optionsObject = { usernameField: "email" };

const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

passport.use(
  new LocalStrategy(optionsObject, async (email, password, done) => {
    try {
      const userData = await prisma.user.findUnique({
        where: { email },
        include: { membership: true },
      });
      await prisma.$disconnect();
      if (!userData)
        return done(null, false, { msg: "Incorrect email", path: "email" });
      const match = await bcrypt.compare(password, userData.password);
      if (!match)
        return done(null, false, {
          msg: "Incorrect password",
          path: "password",
        });

      const lessUserData = {
        ...userData,
        password: "***",
        membership: userData.membership.map((channel) => channel.name),
      };

      console.log("=== lessUserData ===");
      console.log(lessUserData);

      return done(null, lessUserData);
    } catch (e) {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    }
  })
);

router.post("/", validate.loginForm, async (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty())
    return res.status(400).json({ errors: result.array() });
  passport.authenticate("local", async (err, lessUserData, info) => {
    try {
      if (err || !lessUserData) {
        const error = Error("Authentication error", { cause: info });
        return next(error);
      }
      const user = { id: lessUserData.id };
      req.login(user, { session: false }, async (error) => {
        if (error) return next(error);
        const streamToken = serverClient.createToken(lessUserData.username);
        const token = jwt.sign(lessUserData, process.env.JWT_SECRET);
        return res.json({ token, lessUserData, streamToken });
      });
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
});

module.exports = router;
