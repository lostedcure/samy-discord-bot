import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "../lib/embeds.js";
import { requirePermission } from "../lib/permissions.js";
import { parseDiscordId } from "../lib/parse.js";

export default {
  name: "baninfo",
  description: "Afficher les informations d'un bannissement.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.BanMembers))) return;
    const userId = parseDiscordId(args[0]);
    if (!userId) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}baninfo identifiant\``);
    try {
      const entry = await ctx.guild.bans.fetch({ user: userId });
      return replyEmbed(ctx, "info", "Informations de bannissement", `**Utilisateur :** ${entry.user.tag}\n**Identifiant :** \`${entry.user.id}\`\n**Raison :** ${entry.reason || "Aucune raison enregistrée."}`);
    } catch (error) {
      if (error.code === 10026) return replyEmbed(ctx, "info", "Aucun bannissement", "Aucun bannissement actif ne correspond à cet identifiant.");
      throw error;
    }
  },
};
