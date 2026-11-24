import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "../lib/embeds.js";
import { requirePermission } from "../lib/permissions.js";
import { parseDiscordId } from "../lib/parse.js";

export default {
  name: "unbl",
  description: "Retirer un utilisateur de la blacklist.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.ManageGuild))) return;
    const userId = parseDiscordId(args[0]);
    if (!userId) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}unbl identifiant\``);
    const removed = await ctx.repository.removeBlacklistedUser(ctx.guild.id, userId);
    if (!removed) return replyEmbed(ctx, "info", "Aucun changement", "Cet utilisateur n'était pas dans la blacklist.");
    await ctx.log({ action: "blacklist_remove", targetId: userId });
    return replyEmbed(ctx, "success", "Blacklist mise à jour", `<@${userId}> a été retiré de la blacklist.`);
  },
};
