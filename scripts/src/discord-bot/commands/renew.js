import { PermissionFlagsBits } from "discord.js";
import { makeEmbed, replyEmbed } from "../lib/embeds.js";
import { channelCreateOptions, serializeChannel } from "../lib/channel-config.js";
import { requireBotPermission, requirePermission } from "../lib/permissions.js";
import { resolveChannel } from "../lib/targets.js";

export default {
  name: "renew",
  description: "Recréer un salon vide avec ses paramètres et permissions.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.ManageChannels))) return;
    const channel = resolveChannel(ctx, args[0]);
    if (!channel) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}renew #salon CONFIRMER\``);
    if (args[1] !== "CONFIRMER") {
      return replyEmbed(ctx, "warning", "Confirmation requise", `Le salon sera supprimé puis recréé vide. Relance avec \`${ctx.prefix}renew #salon CONFIRMER\`.`);
    }
    if (!(await requireBotPermission(ctx, PermissionFlagsBits.ManageChannels, "Gérer les salons"))) return;
    if (!channel.manageable) return replyEmbed(ctx, "error", "Action impossible", "Le bot ne peut pas gérer ce salon.");

    const snapshot = serializeChannel(channel);
    await ctx.repository.saveChannelSnapshot({
      guildId: ctx.guild.id,
      originalChannelId: channel.id,
      replacementChannelId: null,
      channelConfig: snapshot,
      operation: "renew",
      savedBy: ctx.member.id,
    });
    await channel.delete(`Salon recréé par ${ctx.member.user.tag}`);
    const replacement = await ctx.guild.channels.create(channelCreateOptions(snapshot));
    await ctx.repository.saveChannelSnapshot({
      guildId: ctx.guild.id,
      originalChannelId: channel.id,
      replacementChannelId: replacement.id,
      channelConfig: snapshot,
      operation: "renew",
      savedBy: ctx.member.id,
    });
    await ctx.log({
      action: "channel_renew",
      targetId: replacement.id,
      details: `Ancien salon : ${channel.id}; nouveau salon : ${replacement.id}.`,
    });

    const description = `Le salon <#${replacement.id}> a été recréé avec ses permissions. Son historique précédent n'est pas récupérable.`;
    const embed = makeEmbed("success", "Salon recréé", description);
    if (ctx.message.channel.id === channel.id) {
      return replacement.send({ embeds: [embed], allowedMentions: { parse: [] } });
    }
    return ctx.message.reply({ embeds: [embed], allowedMentions: { parse: [] } });
  },
};
