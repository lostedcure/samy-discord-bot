import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "../lib/embeds.js";
import { requirePermission } from "../lib/permissions.js";
import { parseDiscordId } from "../lib/parse.js";

export default {
  name: "setlog",
  description: "Configurer le salon de logs du serveur.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.ManageGuild))) return;
    if (args[0]?.toLowerCase() === "off") {
      await ctx.repository.setLogChannel(ctx.guild.id, null);
      await ctx.log({ action: "log_channel_disabled", details: "La valeur LOG_CHANNEL_ID du projet, si définie, reste prioritaire." });
      return replyEmbed(ctx, "success", "Logs désactivés", "Le salon de logs de ce serveur a été effacé.");
    }
    const channelId = parseDiscordId(args[0]);
    if (!channelId) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}setlog #salon\` ou \`${ctx.prefix}setlog off\``);
    const channel = await ctx.guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased()) return replyEmbed(ctx, "error", "Salon invalide", "Choisis un salon textuel accessible au bot.");
    await ctx.repository.setLogChannel(ctx.guild.id, channel.id);
    await ctx.log({ action: "log_channel_set", targetId: channel.id });
    return replyEmbed(ctx, "success", "Salon de logs configuré", `Les logs de ce serveur seront envoyés dans <#${channel.id}>.`);
  },
};
