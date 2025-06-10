const { PrismaClient } = require("../generated/prisma/client");
const { validationResult } = require("express-validator");
const validate = require("../middlewares/validator");
const StreamChat = require("stream-chat").StreamChat;

const prisma = new PrismaClient();
const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

const createChannel = [
  validate.createChannelForm,
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    const { name, imageUrl } = req.body;

    console.log("=== createChannel ===");
    console.log(req.body);
    console.log({ creator: req.query.creator });

    try {
      const channel = await prisma.channel.create({
        data: { name, imageUrl, creatorId: req.query.creator },
      });
      await prisma.$disconnect();
      const streamChannel = serverClient.channel(
        "messaging",
        `${channel.name}-${channel.id}`,
        {
          name: channel.name,
          image: channel.imageUrl,
          created_by_id: channel.creatorId,
        }
      );

      await streamChannel.create();

      console.log("=== createChannel ===");
      console.log(channel);
      console.log(streamChannel);

      return res.json(channel);
    } catch (e) {
      console.log("=== Error Creating Channel ===");
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    }
  },
];

module.exports = { createChannel };
