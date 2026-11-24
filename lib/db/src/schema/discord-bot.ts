import {
  bigserial,
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const discordBotWhitelist = pgTable(
  "discord_bot_whitelist",
  {
    guildId: text("guild_id").notNull(),
    botUserId: text("bot_user_id").notNull(),
    addedBy: text("added_by").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.botUserId] }),
  }),
);

export const discordBlacklist = pgTable(
  "discord_blacklist",
  {
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    addedBy: text("added_by").notNull(),
    reason: text("reason").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.userId] }),
  }),
);

export const discordAuthorizedRoles = pgTable(
  "discord_authorized_roles",
  {
    guildId: text("guild_id").notNull(),
    roleId: text("role_id").notNull(),
    addedBy: text("added_by").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.roleId] }),
  }),
);

export const discordGuildSettings = pgTable("discord_guild_settings", {
  guildId: text("guild_id").primaryKey(),
  logChannelId: text("log_channel_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const discordChannelSnapshots = pgTable(
  "discord_channel_snapshots",
  {
    guildId: text("guild_id").notNull(),
    originalChannelId: text("original_channel_id").notNull(),
    replacementChannelId: text("replacement_channel_id"),
    channelConfig: jsonb("channel_config").notNull(),
    operation: text("operation").notNull(),
    savedBy: text("saved_by").notNull(),
    savedAt: timestamp("saved_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.originalChannelId] }),
  }),
);

export const discordAuditLogs = pgTable("discord_audit_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  guildId: text("guild_id").notNull(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  targetId: text("target_id"),
  reason: text("reason"),
  success: boolean("success").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
