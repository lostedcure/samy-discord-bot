const prefix = process.env.BOT_PREFIX?.trim() || "+";

if (prefix.length > 4 || /\s/.test(prefix)) {
  throw new Error("BOT_PREFIX must be 1–4 non-space characters.");
}

export const config = Object.freeze({
  token: process.env.DISCORD_TOKEN,
  prefix,
  fallbackLogChannelId: process.env.LOG_CHANNEL_ID?.trim() || null,
});

if (!config.token) {
  throw new Error("Missing DISCORD_TOKEN. Add it in the project's Secrets.");
}

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL. Enable the project's PostgreSQL database.");
}
