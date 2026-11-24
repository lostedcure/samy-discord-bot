import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "../lib/embeds.js";
import { canModerateTarget, requireBotPermission, requirePermission } from "../lib/permissions.js";
import { reasonFrom } from "../lib/parse.js";
import { resolveMember, resolveRole } from "../lib/targets.js";

export default {
  name: "addrole",
  description: "Ajouter un rôle à un membre.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.ManageRoles))) return;
    if (!args[0] || !args[1]) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}addrole @membre @rôle [raison]\``);
    if (!(await requireBotPermission(ctx, PermissionFlagsBits.ManageRoles, "Gérer les rôles"))) return;
    const target = await resolveMember(ctx, args[0]);
    const role = await resolveRole(ctx, args[1]);
    if (!target) return replyEmbed(ctx, "error", "Membre introuvable", "Vérifie la mention du membre.");
    if (!role || role.id === ctx.guild.id) return replyEmbed(ctx, "error", "Rôle invalide", "Mentionne un rôle attribuable.");
    if (!canModerateTarget(ctx, target) || !role.editable) {
      return replyEmbed(ctx, "error", "Hiérarchie de rôles", "Le rôle ou le membre est au-dessus du bot dans la hiérarchie.");
    }
    if (target.roles.cache.has(role.id)) return replyEmbed(ctx, "info", "Aucun changement", "Ce membre possède déjà ce rôle.");
    const reason = reasonFrom(args, 2);
    await target.roles.add(role, `${reason} — par ${ctx.member.user.tag}`);
    await ctx.log({ action: "role_add", targetId: target.id, reason, details: `Rôle ${role.name} (${role.id})` });
    return replyEmbed(ctx, "success", "Rôle ajouté", `Le rôle **${role.name}** a été ajouté à <@${target.id}>.`);
  },
};
