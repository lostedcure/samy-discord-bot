const lastCommandAt = new Map();
const COOLDOWN_MS = 1_500;

export function checkCooldown(guildId, userId, commandName, now = Date.now()) {
  const key = `${guildId}:${userId}:${commandName}`;
  const last = lastCommandAt.get(key) ?? 0;
  if (now - last < COOLDOWN_MS) return false;
  lastCommandAt.set(key, now);

  if (lastCommandAt.size > 5_000) {
    for (const [entry, timestamp] of lastCommandAt) {
      if (now - timestamp > COOLDOWN_MS * 10) lastCommandAt.delete(entry);
    }
  }
  return true;
}
