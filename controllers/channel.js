const { PrismaClient } = require("../generated/prisma/client");
const { validationResult } = require("express-validator");
const validate = require("../middlewares/validator");
const StreamChat = require("stream-chat").StreamChat;

const prisma = new PrismaClient();
const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET,
  { timeout: 6000 }
);

async function getChannels(req, res) {
  try {
    if (req.query.status !== "ADMIN")
      return res.status(400).json({ message: "Invalid access credentials" });
    const channels = await prisma.channel.findMany();
    await prisma.$disconnect();

    console.log("=== getChannels ===");
    console.log(channels);

    return res.json(channels);
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

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

async function deleteChannel(req, res) {
  try {
    const id = +req.params.id;
    const dbChannel = await prisma.channel.delete({ where: { id } });
    await prisma.$disconnect();
    const streamResponse = await serverClient.deleteChannels(
      [`messaging:${dbChannel.name}-${dbChannel.id}`],
      {
        hard_delete: true,
      }
    );

    console.log("=== deleteChannel ===");
    console.log({ dbChannel, streamResponse });

    return res.json({ dbChannel, streamResponse });
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

module.exports = { getChannels, createChannel, deleteChannel };
