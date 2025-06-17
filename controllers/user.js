const { PrismaClient } = require("../generated/prisma/client");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const validate = require("../middlewares/validator");
const StreamChat = require("stream-chat").StreamChat;

const prisma = new PrismaClient();
const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

async function getUsers(req, res) {
  try {
    if (req.query.status !== "ADMIN")
      return res.status(400).json({ message: "Invalid access credentials" });
    const users = await prisma.user.findMany();

    console.log("=== getUsers ===");
    console.log(users);

    await prisma.$disconnect();
    return res.json(users);
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

const createUser = [
  validate.signUpForm,
  async (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    const { firstName, lastName, username, email, password, admin, adminCode } =
      req.body;
    let status = "BASIC";
    if (admin) {
      if (adminCode === process.env.ADMIN_CODE) {
        status = "ADMIN";
      } else {
        return next(
          Error("Incorrect admin code provided", {
            cause: { msg: "Incorrect code", path: "adminCode" },
          })
        );
      }
    }
    bcrypt.hash(password, 10, async (err, hashedPassword) => {
      if (err) return next(err);
      try {
        const upsertResponse = await serverClient.upsertUser({
          id: username,
          role: status === "ADMIN" ? "admin" : "user",
        });

        console.log("=== createUser ===");
        console.log(upsertResponse);
        const user = await prisma.user.create({
          data: {
            firstName,
            lastName,
            username,
            email,
            password: hashedPassword,
            status,
          },
        });
        await prisma.$disconnect();

        return res.json({ id: user.id, username });
      } catch (e) {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
      }
    });
  },
];

const updateUser = [
  validate.updateUserForm,
  async (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    // No username update to prevent StreamChat from creating a new user
    const { firstName, lastName, email, admin, adminCode } = req.body;

    console.log("=== updateUser 01 ===");
    console.log(req.body);

    let status = "BASIC";
    if (admin) {
      if (adminCode === process.env.ADMIN_CODE) {
        status = "ADMIN";
      } else {
        return next(
          Error("Incorrect admin code provided", {
            cause: { msg: "Incorrect code", path: "adminCode" },
          })
        );
      }
    }
    try {
      const username = req.params.username;
      const upsertResponse = await serverClient.upsertUser({
        id: username,
        role: status === "ADMIN" ? "admin" : "user",
      });
      const userData = await prisma.user.update({
        where: { username },
        data: { firstName, lastName, email, status },
        include: { membership: true },
      });
      await prisma.$disconnect();
      const lessUserData = {
        ...userData,
        password: "***",
        membership: userData.membership.map((channel) => channel.name),
      };

      console.log("=== updateUser ===");
      console.log(upsertResponse);

      console.log("=== user ===");
      console.log(userData);

      console.log("=== lessUserData ===");
      console.log(lessUserData);

      return res.json(lessUserData);
    } catch (e) {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    }
  },
];

async function deleteUser(req, res) {
  try {
    const username = req.params.username;
    const deactivate = await serverClient.deactivateUser(username, {
      mark_messages_deleted: false,
    });

    console.log("=== deleteUser StreamChat ===");
    console.log(deactivate);

    const user = await prisma.user.delete({ where: { username } });
    await prisma.$disconnect();

    console.log("=== deleteUser db ===");
    console.log(user);

    return res.json(user);
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

module.exports = { getUsers, createUser, updateUser, deleteUser };
