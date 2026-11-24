import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "../lib/embeds.js";
import { channelCreateOptions, channelEditOptions } from "../lib/channel-config.js";
import { requireBotPermission, requirePermission } from "../lib/permissions.js";
import { parseDiscordId } from "../lib/parse.js";

async function findChannel(guild, id) {
  try {
    return await guild.channels.fetch(id);
  } catch {
    return null;
  }
}

export default {
  name: "unwipe",
  description: "Restaurer la configuration sauvegardée d'un salon.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.ManageChannels))) return;
    const requestedId = parseDiscordId(args[0]);
    if (!requestedId) {
      return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}unwipe #salon\` — utilise l'ancien ou le nouveau salon.`);
    }
    if (!(await requireBotPermission(ctx, PermissionFlagsBits.ManageChannels, "Gérer les salons"))) return;
    const snapshot = await ctx.repository.findChannelSnapshot(ctx.guild.id, requestedId);
    if (!snapshot) return replyEmbed(ctx, "error", "Sauvegarde introuvable", "Aucune configuration sauvegardée ne correspond à ce salon.");

    const replacementId = snapshot.replacement_channel_id;
    const current = await findChannel(ctx.guild, replacementId ?? requestedId);
    let restored;
    if (current) {
      await current.edit({
        ...channelEditOptions(snapshot.channel_config),
        reason: `Configuration restaurée par ${ctx.member.user.tag}`,
      });
      restored = current;
    } else {
      restored = await ctx.guild.channels.create(channelCreateOptions(snapshot.channel_config));
    }

    await ctx.repository.deleteChannelSnapshot(ctx.guild.id, snapshot.original_channel_id);
    await ctx.log({
      action: "channel_restore",
      targetId: restored.id,
      details: `Configuration issue de ${snapshot.operation}; les messages supprimés ne peuvent pas être restaurés.`,
    });
    return replyEmbed(
      ctx,
      "success",
      "Configuration restaurée",
      `Le salon <#${restored.id}> reprend les paramètres sauvegardés. Les messages supprimés ne peuvent pas être récupérés.`,
    );
  },
};
