import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "../lib/embeds.js";
import { requirePermission } from "../lib/permissions.js";
import { reasonFrom } from "../lib/parse.js";
import { resolveUser } from "../lib/targets.js";

export default {
  name: "bl",
  description: "Ajouter un utilisateur à la blacklist du serveur.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.ManageGuild))) return;
    if (!args[0]) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}bl @utilisateur [raison]\``);
    const user = await resolveUser(ctx, args[0]);
    if (!user) return replyEmbed(ctx, "error", "Utilisateur introuvable", "Vérifie l'identifiant ou la mention.");
    const reason = reasonFrom(args, 1);
    await ctx.repository.addBlacklistedUser(ctx.guild.id, user.id, ctx.member.id, reason);
    await ctx.log({ action: "blacklist_add", targetId: user.id, reason });
    return replyEmbed(ctx, "success", "Blacklist mise à jour", `<@${user.id}> est sur la blacklist de ce serveur.`);
  },
};
