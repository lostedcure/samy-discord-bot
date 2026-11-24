import { checkCooldown } from "./lib/cooldowns.js";
import { replyEmbed } from "./lib/embeds.js";
import { logAction } from "./lib/logging.js";
import { parseMessageCommand } from "./lib/parse.js";
import { commands } from "./commands/index.js";

export async function handleMessage(message, {
  client,
  repository,
  config,
  logger = console,
}) {
  if (!message.guild || message.author?.bot || message.webhookId) return false;
  const parsed = parseMessageCommand(message.content, config.prefix);
  if (!parsed) return false;

  const command = commands.get(parsed.command);
  if (!command) return false;
  if (!checkCooldown(message.guild.id, message.author.id, parsed.command)) return false;

  const ctx = {
    client,
    config,
    repository,
    prefix: config.prefix,
    guild: message.guild,
    member: message.member,
    actorId: message.author.id,
    message,
    log: (details) => logAction({
      client,
      config,
      guild: message.guild,
      member: message.member,
      actorId: message.author.id,
      repository,
    }, details),
  };

  try {
    await command.execute(ctx, parsed.args);
  } catch (error) {
    logger.error(`Command ${parsed.command} failed:`, error);
    await ctx.log({
      action: `${parsed.command}_failure`,
      success: false,
      details: error.code ? `Discord error ${error.code}` : "Unexpected command error",
    });
    await replyEmbed(ctx, "error", "Commande impossible", "Une erreur est survenue. Vérifie les permissions du bot et réessaie.");
  }
  return true;
}
