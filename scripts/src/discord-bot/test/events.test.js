import test from "node:test";
import assert from "node:assert/strict";
import { PermissionFlagsBits } from "discord.js";
import { handleGuildMemberAdd } from "../events/guild-member-add.js";
import { BOT_ID, USER_ID } from "./helpers.js";

function setup({ allowed = false, failLookup = false } = {}) {
  const actions = [];
  const repository = {
    isWhitelisted: async () => {
      if (failLookup) throw new Error("database unavailable");
      return allowed;
    },
    getBlacklistedUser: async () => null,
    recordAudit: async (row) => actions.push(row),
    getLogChannel: async () => null,
  };
  const client = { user: { id: BOT_ID } };
  const member = {
    id: USER_ID,
    user: { id: USER_ID, bot: true },
    kickable: true,
    kick: async () => actions.push({ action: "kick" }),
    guild: {
      id: "10000000000000005",
      members: { me: { permissions: { has: (permission) => permission === PermissionFlagsBits.KickMembers } } },
      channels: { cache: new Map() },
    },
  };
  return { member, client, repository, actions };
}

test("a whitelisted bot is never expelled", async () => {
  const context = setup({ allowed: true });
  await handleGuildMemberAdd(context.member, { ...context, config: {}, logger: { error() {} } });
  assert.equal(context.actions.some((row) => row.action === "kick"), false);
});

test("a non-whitelisted bot is expelled only when the bot has permission", async () => {
  const context = setup();
  await handleGuildMemberAdd(context.member, { ...context, config: {}, logger: { error() {} } });
  assert.equal(context.actions.some((row) => row.action === "kick"), true);
  assert.equal(context.actions.some((row) => row.action === "unapproved_bot_removed"), true);
});

test("a non-whitelisted bot stays when the bot lacks Kick Members", async () => {
  const context = setup();
  context.member.guild.members.me.permissions.has = () => false;
  await handleGuildMemberAdd(context.member, { ...context, config: {}, logger: { error() {} } });
  assert.equal(context.actions.some((row) => row.action === "kick"), false);
  assert.equal(context.actions.some((row) => row.action === "unapproved_bot_not_removed"), true);
});

test("a failed whitelist read never causes an automatic expulsion", async () => {
  const context = setup({ failLookup: true });
  await handleGuildMemberAdd(context.member, { ...context, config: {}, logger: { error() {} } });
  assert.equal(context.actions.some((row) => row.action === "kick"), false);
});

test("the bot itself is ignored by the join listener", async () => {
  const context = setup();
  context.member.id = BOT_ID;
  await handleGuildMemberAdd(context.member, { ...context, config: {}, logger: { error() {} } });
  assert.equal(context.actions.length, 0);
});
