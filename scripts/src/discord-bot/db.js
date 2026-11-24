import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export const repository = {
  async isWhitelisted(guildId, botUserId) {
    const result = await pool.query(
      "SELECT 1 FROM discord_bot_whitelist WHERE guild_id = $1 AND bot_user_id = $2",
      [guildId, botUserId],
    );
    return result.rowCount > 0;
  },

  async addWhitelistedBot(guildId, botUserId, addedBy) {
    const result = await pool.query(
      `INSERT INTO discord_bot_whitelist (guild_id, bot_user_id, added_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (guild_id, bot_user_id) DO NOTHING
       RETURNING guild_id, bot_user_id, added_by, added_at`,
      [guildId, botUserId, addedBy],
    );
    return result.rows[0] ?? null;
  },

  async removeWhitelistedBot(guildId, botUserId) {
    const result = await pool.query(
      `DELETE FROM discord_bot_whitelist
       WHERE guild_id = $1 AND bot_user_id = $2
       RETURNING guild_id, bot_user_id, added_by, added_at`,
      [guildId, botUserId],
    );
    return result.rows[0] ?? null;
  },

  async listWhitelistedBots(guildId) {
    const result = await pool.query(
      `SELECT bot_user_id, added_by, added_at
       FROM discord_bot_whitelist
       WHERE guild_id = $1
       ORDER BY added_at DESC, bot_user_id`,
      [guildId],
    );
    return result.rows;
  },

  async getWhitelistedBot(guildId, botUserId) {
    const result = await pool.query(
      `SELECT bot_user_id, added_by, added_at
       FROM discord_bot_whitelist
       WHERE guild_id = $1 AND bot_user_id = $2`,
      [guildId, botUserId],
    );
    return result.rows[0] ?? null;
  },

  async clearWhitelistedBots(guildId, protectedBotId) {
    const result = await pool.query(
      `DELETE FROM discord_bot_whitelist
       WHERE guild_id = $1 AND bot_user_id <> $2
       RETURNING bot_user_id`,
      [guildId, protectedBotId],
    );
    return result.rowCount;
  },

  async addBlacklistedUser(guildId, userId, addedBy, reason) {
    const result = await pool.query(
      `INSERT INTO discord_blacklist (guild_id, user_id, added_by, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (guild_id, user_id)
       DO UPDATE SET added_by = EXCLUDED.added_by,
                     reason = EXCLUDED.reason,
                     added_at = NOW()
       RETURNING guild_id, user_id, added_by, reason, added_at`,
      [guildId, userId, addedBy, reason],
    );
    return result.rows[0];
  },

  async removeBlacklistedUser(guildId, userId) {
    const result = await pool.query(
      `DELETE FROM discord_blacklist
       WHERE guild_id = $1 AND user_id = $2
       RETURNING guild_id, user_id, added_by, reason, added_at`,
      [guildId, userId],
    );
    return result.rows[0] ?? null;
  },

  async getBlacklistedUser(guildId, userId) {
    const result = await pool.query(
      `SELECT guild_id, user_id, added_by, reason, added_at
       FROM discord_blacklist
       WHERE guild_id = $1 AND user_id = $2`,
      [guildId, userId],
    );
    return result.rows[0] ?? null;
  },

  async listAuthorizedRoles(guildId) {
    const result = await pool.query(
      `SELECT role_id FROM discord_authorized_roles
       WHERE guild_id = $1 ORDER BY added_at, role_id`,
      [guildId],
    );
    return result.rows.map((row) => row.role_id);
  },

  async addAuthorizedRole(guildId, roleId, addedBy) {
    const result = await pool.query(
      `INSERT INTO discord_authorized_roles (guild_id, role_id, added_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (guild_id, role_id) DO NOTHING
       RETURNING role_id`,
      [guildId, roleId, addedBy],
    );
    return result.rows[0] ?? null;
  },

  async removeAuthorizedRole(guildId, roleId) {
    const result = await pool.query(
      `DELETE FROM discord_authorized_roles
       WHERE guild_id = $1 AND role_id = $2
       RETURNING role_id`,
      [guildId, roleId],
    );
    return result.rows[0] ?? null;
  },

  async setLogChannel(guildId, channelId) {
    await pool.query(
      `INSERT INTO discord_guild_settings (guild_id, log_channel_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (guild_id)
       DO UPDATE SET log_channel_id = EXCLUDED.log_channel_id, updated_at = NOW()`,
      [guildId, channelId],
    );
  },

  async getLogChannel(guildId) {
    const result = await pool.query(
      "SELECT log_channel_id FROM discord_guild_settings WHERE guild_id = $1",
      [guildId],
    );
    return result.rows[0]?.log_channel_id ?? null;
  },

  async saveChannelSnapshot({
    guildId,
    originalChannelId,
    replacementChannelId,
    channelConfig,
    operation,
    savedBy,
  }) {
    await pool.query(
      `INSERT INTO discord_channel_snapshots
        (guild_id, original_channel_id, replacement_channel_id, channel_config, operation, saved_by, saved_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (guild_id, original_channel_id)
       DO UPDATE SET replacement_channel_id = EXCLUDED.replacement_channel_id,
                     channel_config = EXCLUDED.channel_config,
                     operation = EXCLUDED.operation,
                     saved_by = EXCLUDED.saved_by,
                     saved_at = NOW()`,
      [
        guildId,
        originalChannelId,
        replacementChannelId,
        channelConfig,
        operation,
        savedBy,
      ],
    );
  },

  async findChannelSnapshot(guildId, channelId) {
    const result = await pool.query(
      `SELECT guild_id, original_channel_id, replacement_channel_id,
              channel_config, operation, saved_by, saved_at
       FROM discord_channel_snapshots
       WHERE guild_id = $1
         AND (original_channel_id = $2 OR replacement_channel_id = $2)
       ORDER BY saved_at DESC
       LIMIT 1`,
      [guildId, channelId],
    );
    return result.rows[0] ?? null;
  },

  async deleteChannelSnapshot(guildId, originalChannelId) {
    await pool.query(
      `DELETE FROM discord_channel_snapshots
       WHERE guild_id = $1 AND original_channel_id = $2`,
      [guildId, originalChannelId],
    );
  },

  async recordAudit({
    guildId,
    actorId,
    action,
    targetId = null,
    reason = null,
    success,
    details = null,
  }) {
    await pool.query(
      `INSERT INTO discord_audit_logs
        (guild_id, actor_id, action, target_id, reason, success, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [guildId, actorId, action, targetId, reason, success, details],
    );
  },
};
