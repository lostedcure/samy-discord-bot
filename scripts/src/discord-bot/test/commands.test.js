import test from "node:test";
import assert from "node:assert/strict";
import { PermissionFlagsBits } from "discord.js";
import { commands } from "../commands/index.js";
import { handleMessage } from "../dispatcher.js";
import { parseDiscordId, parseDuration, parseMessageCommand, formatDuration } from "../lib/parse.js";
import { checkCooldown } from "../lib/cooldowns.js";
import { makeAuthorizedContext, makeMessage, ACTOR_ID, BOT_ID, USER_ID } from "./helpers.js";

const REQUIRED = [
  "addrole", "ban", "baninfo", "bl", "blinfo", "clear", "help", "kick",
  "roleallow", "rolelist", "roleremove", "renew", "setlog", "to",
  "unban", "unbl", "unwipe", "wipe", "wlbot",
];

test("every command has a separate registered handler", () => {
  assert.deepEqual([...commands.keys()].sort(), [...REQUIRED].sort());
  for (const command of commands.values()) assert.equal(typeof command.execute, "function");
});

test("commands are parsed only with the configured message prefix", () => {
  assert.deepEqual(parseMessageCommand("+ban <@10000000000000003> raison"), {
    command: "ban",
    args: ["<@10000000000000003>", "raison"],
  });
  assert.deepEqual(parseMessageCommand("!help", "!"), { command: "help", args: [] });
  assert.equal(parseMessageCommand("/ban <@10000000000000003>"), null);
  assert.equal(parseMessageCommand(" +help"), null);
});

test("Discord IDs, durations and cooldowns are validated", () => {
  assert.equal(parseDiscordId(`<@${USER_ID}>`), USER_ID);
  assert.equal(parseDiscordId(`<@&${USER_ID}>`), USER_ID);
  assert.equal(parseDiscordId("not-an-id"), null);
  assert.equal(parseDuration("15m"), 900_000);
  assert.equal(parseDuration("29d"), null);
  assert.equal(parseDuration("0h"), null);
  assert.equal(formatDuration(90_000), "1min 30s");
  assert.equal(checkCooldown("guild-test", "user-test", "help", 10_000), true);
  assert.equal(checkCooldown("guild-test", "user-test", "help", 10_500), false);
});

test("unauthorized users are denied by every protected command", async () => {
  for (const command of commands.values()) {
    const message = makeMessage();
    const ctx = {
      message,
      guild: message.guild,
      member: message.member,
      client: { user: { id: BOT_ID } },
      repository: { listAuthorizedRoles: async () => [] },
      prefix: "+",
    };
    await assert.doesNotReject(command.execute(ctx, []), command.name);
    if (command.name !== "help") {
      assert.ok(message.replies.length > 0, `${command.name} should explain denial or usage`);
    }
  }
});

test("MessageCreate dispatch ignores slash commands and bot messages", async () => {
  const { ctx, message } = makeAuthorizedContext();
  let called = 0;
  ctx.message = {
    ...message,
    reply: async () => {
      called += 1;
      return { embeds: [] };
    },
  };
  assert.equal(await handleMessage({ ...ctx.message, content: "/help" }, ctx), false);
  assert.equal(await handleMessage({ ...ctx.message, content: "+help", author: { ...ctx.message.author, bot: true } }, ctx), false);
  assert.equal(await handleMessage({ ...ctx.message, content: "+help" }, ctx), true);
  assert.equal(called, 1);
});

test("wlbot add accepts only bot accounts and persists the bot ID", async () => {
  const { ctx, repository, logs } = makeAuthorizedContext();
  let saved;
  repository.addWhitelistedBot = async (...args) => {
    saved = args;
    return { bot_user_id: args[1], added_by: args[2], added_at: new Date() };
  };
  await commands.get("wlbot").execute(ctx, ["add", `<@${USER_ID}>`]);
  assert.deepEqual(saved, [ctx.guild.id, USER_ID, ACTOR_ID]);
  assert.equal(logs[0].action, "bot_whitelist_add");

  ctx.client.users.fetch = async (id) => ({ id, bot: false });
  const before = ctx.message.replies.length;
  await commands.get("wlbot").execute(ctx, ["add", USER_ID]);
  assert.equal(ctx.message.replies.length, before + 1);
});

test("wlbot cannot remove the main bot and clear requires confirmation", async () => {
  const { ctx, repository } = makeAuthorizedContext();
  let removed = false;
  let clearedWith;
  repository.removeWhitelistedBot = async () => {
    removed = true;
  };
  repository.clearWhitelistedBots = async (...args) => {
    clearedWith = args;
    return 3;
  };

  await commands.get("wlbot").execute(ctx, ["remove", BOT_ID]);
  assert.equal(removed, false);
  await commands.get("wlbot").execute(ctx, ["clear"]);
  assert.equal(clearedWith, undefined);
  await commands.get("wlbot").execute(ctx, ["clear", "CONFIRMER"]);
  assert.deepEqual(clearedWith, [ctx.guild.id, BOT_ID]);
});

test("clear validates the amount before deleting messages", async () => {
  const { ctx, message } = makeAuthorizedContext([PermissionFlagsBits.ManageMessages]);
  let deleted = 0;
  message.channel.bulkDelete = async (amount) => {
    deleted = amount;
    return { size: amount };
  };
  await commands.get("clear").execute(ctx, ["101"]);
  assert.equal(deleted, 0);
  await commands.get("clear").execute(ctx, ["5"]);
  assert.equal(deleted, 5);
});

test("wipe requires the explicit confirmation before saving or deleting", async () => {
  const { ctx, message, repository } = makeAuthorizedContext([PermissionFlagsBits.ManageMessages]);
  let saved = false;
  repository.saveChannelSnapshot = async () => {
    saved = true;
  };
  message.guild.channels.cache.set("10000000000000007", {
    id: "10000000000000007",
    isTextBased: () => true,
    messages: { fetch: async () => new Map() },
  });
  await commands.get("wipe").execute(ctx, ["<#10000000000000007>"]);
  assert.equal(saved, false);
});

test("authorized roles are checked before moderation access", async () => {
  const { ctx, repository } = makeAuthorizedContext([]);
  repository.listAuthorizedRoles = async () => ["10000000000000008"];
  repository.listWhitelistedBots = async () => [];
  ctx.member.roles.cache = [{ id: "10000000000000008" }];
  await commands.get("wlbot").execute(ctx, ["list"]);
  assert.equal(ctx.message.replies.length, 1);
});

test("every command rejects missing or malformed input without throwing", async () => {
  const permissions = [
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.ModerateMembers,
    PermissionFlagsBits.ManageChannels,
  ];
  for (const command of commands.values()) {
    const { ctx, message } = makeAuthorizedContext(permissions);
    ctx.repository.listAuthorizedRoles = async () => [];
    ctx.repository.listWhitelistedBots = async () => [];
    await assert.doesNotReject(command.execute(ctx, []), command.name);
    if (command.name !== "help") {
      assert.ok(message.replies.length > 0, `${command.name} should give usage or help for empty input`);
    }
  }
});
