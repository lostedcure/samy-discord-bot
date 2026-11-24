import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "../lib/embeds.js";
import { requirePermission } from "../lib/permissions.js";
import { parseDiscordId } from "../lib/parse.js";

export default {
  name: "blinfo",
  description: "Afficher les informations de blacklist d'un utilisateur.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.ManageGuild))) return;
    const userId = parseDiscordId(args[0]);
    if (!userId) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}blinfo identifiant\``);
    const entry = await ctx.repository.getBlacklistedUser(ctx.guild.id, userId);
    if (!entry) return replyEmbed(ctx, "info", "Aucune entrée", "Cet utilisateur n'est pas dans la blacklist.");
    return replyEmbed(ctx, "info", "Informations de blacklist", `Utilisateur : <@${entry.user_id}>`, [
      { name: "Ajouté par", value: `<@${entry.added_by}>`, inline: true },
      { name: "Ajouté le", value: new Date(entry.added_at).toLocaleString("fr-FR"), inline: true },
      { name: "Raison", value: entry.reason.slice(0, 1024) },
    ]);
  },
};
