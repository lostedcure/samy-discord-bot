import { Client, Events, GatewayIntentBits } from "discord.js";
import { config } from "./config.js";
import { pool, repository } from "./db.js";
import { handleMessage } from "./dispatcher.js";
import { handleGuildMemberAdd } from "./events/guild-member-add.js";

async function assertDatabaseReady() {
  const result = await pool.query(`
    SELECT
      to_regclass('public.discord_bot_whitelist') IS NOT NULL AS whitelist,
      to_regclass('public.discord_blacklist') IS NOT NULL AS blacklist,
      to_regclass('public.discord_authorized_roles') IS NOT NULL AS authorized_roles,
      to_regclass('public.discord_guild_settings') IS NOT NULL AS guild_settings,
      to_regclass('public.discord_channel_snapshots') IS NOT NULL AS channel_snapshots,
      to_regclass('public.discord_audit_logs') IS NOT NULL AS audit_logs
  `);
  if (Object.values(result.rows[0]).some((exists) => !exists)) {
    throw new Error("Discord bot database tables are missing. Run `pnpm --filter @workspace/db run push` first.");
  }
}

export async function startBot() {
  await assertDatabaseReady();
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once(Events.ClientReady, (readyClient) => {
    console.info(`Connected as ${readyClient.user.tag}; prefix ${config.prefix}`);
    readyClient.user.setActivity(`${config.prefix}help`);
  });

  client.on(Events.MessageCreate, (message) => {
    void handleMessage(message, { client, repository, config }).catch((error) => {
      console.error("Message handler failed:", error);
    });
  });

  client.on(Events.GuildMemberAdd, (member) => {
    void handleGuildMemberAdd(member, { client, repository, config }).catch((error) => {
      console.error("Guild member event failed:", error);
    });
  });

  client.on(Events.Error, (error) => console.error("Discord client error:", error));
  await client.login(config.token);
  return client;
}

let activeClient;
let stopping = false;

async function stopBot(signal) {
  if (stopping) return;
  stopping = true;
  console.info(`Stopping Discord bot (${signal}).`);
  activeClient?.destroy();
  await pool.end();
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    void stopBot(signal).finally(() => process.exit(0));
  });
}

startBot()
  .then((client) => {
    activeClient = client;
  })
  .catch(async (error) => {
    console.error("Discord bot could not start:", error.message);
    await pool.end().catch(() => {});
    process.exitCode = 1;
  });
