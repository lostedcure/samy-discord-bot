import { replyEmbed } from "../lib/embeds.js";
import { requireGuildAdmin } from "../lib/permissions.js";
import { parseDiscordId } from "../lib/parse.js";

export default {
  name: "roleremove",
  description: "Retirer un rôle de la liste des rôles autorisés.",
  async execute(ctx, args) {
    if (!(await requireGuildAdmin(ctx))) return;
    const roleId = parseDiscordId(args[0]);
    if (!roleId) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}roleremove @rôle\``);
    const removed = await ctx.repository.removeAuthorizedRole(ctx.guild.id, roleId);
    if (!removed) return replyEmbed(ctx, "info", "Aucun changement", "Ce rôle n'était pas autorisé.");
    await ctx.log({ action: "authorized_role_remove", targetId: roleId });
    return replyEmbed(ctx, "success", "Rôle retiré", `Le rôle <@&${roleId}> n'est plus autorisé.`);
  },
};
