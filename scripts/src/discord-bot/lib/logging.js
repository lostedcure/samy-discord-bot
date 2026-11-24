import { makeEmbed } from "./embeds.js";

export async function logAction(ctx, {
  action,
  targetId = null,
  reason = null,
  success = true,
  details = null,
  title,
}) {
  try {
    await ctx.repository.recordAudit({
      guildId: ctx.guild.id,
      actorId: ctx.actorId ?? ctx.member?.id ?? ctx.client.user.id,
      action,
      targetId,
      reason,
      success,
      details,
    });
  } catch (error) {
    console.error("Audit database write failed:", error.message);
  }

  let channelId;
  try {
    channelId = await ctx.repository.getLogChannel(ctx.guild.id);
  } catch (error) {
    console.error("Could not load the configured log channel:", error.message);
  }
  channelId ||= ctx.config.fallbackLogChannelId;
  if (!channelId) return;

  const channel = ctx.guild.channels.cache.get(channelId);
  if (!channel?.isTextBased()) return;

  const embed = makeEmbed(
    success ? "info" : "error",
    title ?? (success ? "Action enregistrée" : "Action refusée"),
    `**Action :** ${action}\n**Auteur :** <@${ctx.actorId ?? ctx.member?.id ?? ctx.client.user.id}>${targetId ? `\n**Cible :** <@${targetId}>` : ""}${reason ? `\n**Raison :** ${reason}` : ""}`,
  );
  if (details) embed.addFields({ name: "Détails", value: String(details).slice(0, 1024) });
  await channel.send({ embeds: [embed], allowedMentions: { parse: [] } }).catch((error) => {
    console.error("Could not send to the configured log channel:", error.message);
  });
}
