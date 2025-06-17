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
    try {
      const { name, imageUrl } = req.body;
      const creatorId = req.query.creator;
      const streamId = name.trim().replace(/\s/g, "-").toLowerCase();
      const streamChannel = serverClient.channel("messaging", streamId, {
        name,
        image: imageUrl,
        created_by_id: creatorId,
      });
      await streamChannel.create();
      const channel = await prisma.channel.create({
        data: { name, imageUrl, creatorId, streamId },
      });
      await prisma.$disconnect();
      return res.json(channel);
    } catch (e) {
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
      const streamId = req.params.id;
      const creatorId = req.query.creator;
      const { name, imageUrl } = req.body;
      const streamChannel = serverClient.channel("messaging", streamId);
      await streamChannel.update(
        { name: name, image: imageUrl, created_by_id: creatorId },
        { text: `${creatorId} updated the channel`, user_id: creatorId }
      );
      const channel = await prisma.channel.update({
        where: { streamId },
        data: { name, imageUrl, creatorId: req.query.creator },
      });
      await prisma.$disconnect();
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
    const channelId = req.params.channelId;
    const userId = req.params.username;
    const streamChannel = serverClient.channel("messaging", channelId);
    await streamChannel.addMembers([userId]);
    const channel = await prisma.channel.update({
      where: { streamId: channelId },
      data: { members: { connect: { username: userId } } },
      include: { members: true },
    });
    await prisma.$disconnect();
    return res.json(channel.members.map((member) => member.username));
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

async function unsubscribeFromChannel(req, res) {
  try {
    const channelId = req.params.channelId;
    const userId = req.params.username;
    const streamChannel = serverClient.channel("messaging", channelId);
    await streamChannel.removeMembers([userId]);
    const channel = await prisma.channel.update({
      where: { streamId: channelId },
      data: { members: { disconnect: { username: userId } } },
      include: { members: true },
    });
    await prisma.$disconnect();
    return res.json(channel.members.map((member) => member.username));
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

async function deleteChannel(req, res) {
  try {
    const streamId = req.params.id;
    const streamResponse = await serverClient.deleteChannels(
      [`messaging:${streamId}`],
      { hard_delete: true }
    );
    const dbChannel = await prisma.channel.delete({ where: { streamId } });
    await prisma.$disconnect();
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
