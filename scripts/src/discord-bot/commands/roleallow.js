import { replyEmbed } from "../lib/embeds.js";
import { requireGuildAdmin } from "../lib/permissions.js";
import { resolveRole } from "../lib/targets.js";

export default {
  name: "roleallow",
  description: "Autoriser un rôle à utiliser les commandes de modération.",
  async execute(ctx, args) {
    if (!(await requireGuildAdmin(ctx))) return;
    const role = await resolveRole(ctx, args[0]);
    if (!role || role.id === ctx.guild.id || role.managed) {
      return replyEmbed(ctx, "error", "Rôle invalide", `Syntaxe : \`${ctx.prefix}roleallow @rôle\` — choisis un rôle normal du serveur.`);
    }
    const added = await ctx.repository.addAuthorizedRole(ctx.guild.id, role.id, ctx.member.id);
    if (!added) return replyEmbed(ctx, "info", "Déjà autorisé", `Le rôle **${role.name}** est déjà autorisé.`);
    await ctx.log({ action: "authorized_role_add", targetId: role.id });
    return replyEmbed(ctx, "success", "Rôle autorisé", `Les membres avec le rôle **${role.name}** peuvent utiliser les commandes protégées.`);
  },
};
