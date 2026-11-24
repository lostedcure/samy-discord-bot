import { replyEmbed } from "../lib/embeds.js";
import { requireGuildAdmin } from "../lib/permissions.js";

export default {
  name: "rolelist",
  description: "Afficher les rôles autorisés.",
  async execute(ctx) {
    if (!(await requireGuildAdmin(ctx))) return;
    const roleIds = await ctx.repository.listAuthorizedRoles(ctx.guild.id);
    if (!roleIds.length) return replyEmbed(ctx, "info", "Aucun rôle autorisé", `Utilise \`${ctx.prefix}roleallow @rôle\` pour en ajouter un.`);
    return replyEmbed(ctx, "info", "Rôles autorisés", roleIds.map((id) => `• <@&${id}>`).join("\n"));
  },
};
