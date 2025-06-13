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
    const channels = await prisma.channel.findMany({
      include: { members: true },
    });
    await prisma.$disconnect();

    const channelsWithLessMembersData = channels.map((channel) => {
      return {
        ...channel,
        members: channel.members.map((member) => member.username),
      };
    });

    console.log("=== getChannels ===");
    console.log(channelsWithLessMembersData);

    return res.json(channelsWithLessMembersData);
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

const createChannel = [
  validate.channelForm,
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    const { name, imageUrl } = req.body;

    try {
      const channel = await prisma.channel.create({
        data: { name, imageUrl, creatorId: req.query.creator },
      });
      await prisma.$disconnect();
      const streamChannel = serverClient.channel("messaging", `${channel.id}`, {
        name: channel.name,
        image: channel.imageUrl,
        created_by_id: channel.creatorId,
      });

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

const updateChannel = [
  validate.channelForm,
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty())
      return res.status(400).json({ errors: result.array() });
    try {
      console.log("=== updateChannel ===");
      const id = +req.params.id;
      const { name, imageUrl } = req.body;
      const channel = await prisma.channel.update({
        where: { id },
        data: { name, imageUrl, creatorId: req.query.creator },
      });
      await prisma.$disconnect();

      console.log(channel);

      const streamChannel = serverClient.channel("messaging", `${channel.id}`);
      await streamChannel.update(
        {
          name: channel.name,
          image: channel.imageUrl,
          created_by_id: channel.creatorId,
        },
        {
          text: `${channel.creatorId} updated the channel`,
          user_id: channel.creatorId,
        }
      );

      console.log(streamChannel);

      return res.json(channel);
    } catch (e) {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    }
  },
];

async function subscribeToChannel(req, res) {
  try {
    console.log("=== subscribeToChannel ===");
    const channelId = +req.params.channelId;
    const userId = req.params.username;

    console.log({ channelId, userId });

    const channel = await prisma.channel.update({
      where: { id: channelId },
      data: { members: { connect: { username: userId } } },
      include: { members: true },
    });
    await prisma.$disconnect();

    console.log("=== DB subscribeToChannel ===");
    console.log(channel);

    const streamChannel = serverClient.channel("messaging", `${channelId}`);
    await streamChannel.addMembers([userId]);

    console.log(streamChannel);
    console.log("=== Channel's members ===");
    console.log(channel.members.map((member) => member.username));

    return res.json(channel.members.map((member) => member.username));
  } catch (e) {
    console.log("=== Error data object ===");
    console.error(e);

    // Reverse db action if StreamChat error
    if (e?.response?.request?.host.search(/stream/i)) {
      const channelId = +req.params.channelId;
      const userId = req.params.username;
      const channel = await prisma.channel.update({
        where: { id: channelId },
        data: { members: { disconnect: { username: userId } } },
        include: { members: true },
      });
      console.log("=== DB REVERSE subscribeToChannel ===");
      console.error(e.response.request);
      console.log(channel);
    }

    await prisma.$disconnect();
    process.exit(1);
  }
}

async function unsubscribeFromChannel(req, res) {
  try {
    console.log("=== unsubscribeFromChannel ===");
    const channelId = +req.params.channelId;
    const userId = req.params.username;

    console.log({ channelId, userId });

    const channel = await prisma.channel.update({
      where: { id: channelId },
      data: { members: { disconnect: { username: userId } } },
      include: { members: true },
    });
    await prisma.$disconnect();

    console.log(channel);

    const streamChannel = serverClient.channel("messaging", `${channelId}`);
    await streamChannel.removeMembers([userId]);

    console.log(streamChannel);
    console.log("=== Channel's members ===");
    console.log(channel.members.map((member) => member.username));

    return res.json(channel.members.map((member) => member.username));
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

async function deleteChannel(req, res) {
  try {
    const id = +req.params.id;
    const dbChannel = await prisma.channel.delete({ where: { id } });
    await prisma.$disconnect();
    const streamResponse = await serverClient.deleteChannels(
      [`messaging:${dbChannel.id}`],
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

module.exports = {
  getChannels,
  createChannel,
  updateChannel,
  subscribeToChannel,
  unsubscribeFromChannel,
  deleteChannel,
};
