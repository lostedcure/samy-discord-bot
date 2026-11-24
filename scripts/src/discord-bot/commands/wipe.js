import { PermissionFlagsBits } from "discord.js";
import { makeEmbed, replyEmbed } from "../lib/embeds.js";
import { serializeChannel } from "../lib/channel-config.js";
import { requireBotPermission, requirePermission } from "../lib/permissions.js";
import { resolveChannel } from "../lib/targets.js";

const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
const MAX_MESSAGES_PER_WIPE = 5_000;

export default {
  name: "wipe",
  description: "Vider l'historique accessible d'un salon après confirmation.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.ManageMessages))) return;
    const channel = resolveChannel(ctx, args[0]);
    if (!channel?.isTextBased() || !channel.messages) {
      return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}wipe #salon CONFIRMER\``);
    }
    if (args[1] !== "CONFIRMER") {
      return replyEmbed(ctx, "warning", "Confirmation requise", `Cette action supprime définitivement jusqu'à ${MAX_MESSAGES_PER_WIPE} messages. Relance avec \`${ctx.prefix}wipe #salon CONFIRMER\`.`);
    }
    if (!(await requireBotPermission(ctx, PermissionFlagsBits.ManageMessages, "Gérer les messages"))) return;

    await ctx.repository.saveChannelSnapshot({
      guildId: ctx.guild.id,
      originalChannelId: channel.id,
      replacementChannelId: channel.id,
      channelConfig: serializeChannel(channel),
      operation: "wipe",
      savedBy: ctx.member.id,
    });

    let deleted = 0;
    let failed = false;
    while (deleted < MAX_MESSAGES_PER_WIPE) {
      const batch = await channel.messages.fetch({ limit: Math.min(100, MAX_MESSAGES_PER_WIPE - deleted) });
      if (!batch.size) break;
      const recent = batch.filter((message) => Date.now() - message.createdTimestamp < FOURTEEN_DAYS);
      const old = batch.filter((message) => Date.now() - message.createdTimestamp >= FOURTEEN_DAYS);

      if (recent.size) {
        const result = await channel.bulkDelete(recent, true);
        deleted += result.size;
      }
      for (const message of old.values()) {
        try {
          await message.delete();
          deleted += 1;
        } catch (error) {
          if (error.code !== 10008) throw error;
        }
      }
      if (batch.size === 0 || (recent.size === 0 && old.size === 0)) break;
      if (batch.size < 100) break;
    }
    if (deleted >= MAX_MESSAGES_PER_WIPE) failed = true;

    await ctx.log({
      action: "channel_wipe",
      targetId: channel.id,
      reason: args.slice(2).join(" ") || null,
      details: `${deleted} message(s) supprimé(s)${failed ? " (limite de sécurité atteinte)" : ""}.`,
    });
    const embed = makeEmbed(
      failed ? "warning" : "success",
      failed ? "Nettoyage partiel" : "Salon nettoyé",
      `${deleted} message(s) supprimé(s) dans <#${channel.id}>. La configuration du salon a été sauvegardée pour \`${ctx.prefix}unwipe\`. La suppression des messages est définitive.`,
    );
    return channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  },
};
