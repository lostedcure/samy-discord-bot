import { PermissionFlagsBits } from "discord.js";

export const BOT_ID = "10000000000000001";
export const ACTOR_ID = "10000000000000002";
export const USER_ID = "10000000000000003";
export const CHANNEL_ID = "10000000000000004";

export function makeMessage(content = "") {
  const replies = [];
  return {
    content,
    author: { id: ACTOR_ID, bot: false },
    webhookId: null,
    guild: {
      id: "10000000000000005",
      ownerId: "10000000000000006",
      members: { me: { permissions: { has: () => true } } },
      channels: { cache: new Map() },
    },
    member: {
      id: ACTOR_ID,
      user: { tag: "Moderator#0001" },
      permissions: { has: () => false },
      roles: { cache: [] },
    },
    channel: {
      id: CHANNEL_ID,
      isTextBased: () => true,
      bulkDelete: async (amount) => ({ size: amount }),
    },
    replies,
    async reply(payload) {
      replies.push(payload);
      return { embeds: payload.embeds ?? [] };
    },
  };
}

export function makeAuthorizedContext(commandPermissions = [PermissionFlagsBits.ManageGuild]) {
  const message = makeMessage();
  message.member.permissions.has = (permission) => commandPermissions.includes(permission);
  const logs = [];
  const repository = {
    listAuthorizedRoles: async () => [],
    addWhitelistedBot: async (guildId, botUserId, addedBy) => ({ guild_id: guildId, bot_user_id: botUserId, added_by: addedBy, added_at: new Date() }),
    removeWhitelistedBot: async () => null,
    clearWhitelistedBots: async () => 0,
  };
  const client = {
    user: { id: BOT_ID },
    users: { fetch: async (id) => ({ id, bot: true, tag: `bot-${id}` }) },
  };
  const config = { prefix: "+", fallbackLogChannelId: null };
  const ctx = {
    client,
    config,
    repository,
    prefix: "+",
    guild: message.guild,
    member: message.member,
    actorId: ACTOR_ID,
    message,
    log: async (entry) => logs.push(entry),
  };
  return { ctx, message, repository, client, logs };
}
