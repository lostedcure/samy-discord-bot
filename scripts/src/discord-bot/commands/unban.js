import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "../lib/embeds.js";
import { requireBotPermission, requirePermission } from "../lib/permissions.js";
import { parseDiscordId, reasonFrom } from "../lib/parse.js";

export default {
  name: "unban",
  description: "Débannir un utilisateur avec son identifiant.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.BanMembers))) return;
    const userId = parseDiscordId(args[0]);
    if (!userId) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}unban identifiant [raison]\``);
    if (!(await requireBotPermission(ctx, PermissionFlagsBits.BanMembers, "Bannir des membres"))) return;
    const reason = reasonFrom(args, 1);
    try {
      const ban = await ctx.guild.bans.fetch({ user: userId });
      await ctx.guild.members.unban(userId, `${reason} — par ${ctx.member.user.tag}`);
      await ctx.log({ action: "unban", targetId: userId, reason });
      return replyEmbed(ctx, "success", "Bannissement retiré", `${ban.user.tag} peut de nouveau rejoindre le serveur.`);
    } catch (error) {
      if (error.code === 10026) {
        return replyEmbed(ctx, "error", "Bannissement introuvable", "Aucun bannissement actif ne correspond à cet identifiant.");
      }
      throw error;
    }
  },
};
