import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "../lib/embeds.js";
import { requireBotPermission, requirePermission, canModerateTarget } from "../lib/permissions.js";
import { formatDuration, parseDuration, reasonFrom } from "../lib/parse.js";
import { resolveMember } from "../lib/targets.js";

export default {
  name: "to",
  description: "Mettre un membre en timeout (ex. 15m, 2h, 1d).",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.ModerateMembers))) return;
    if (!args[0] || !args[1]) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}to @membre durée [raison]\` — unités s, m, h ou d.`);
    const duration = parseDuration(args[1]);
    if (!duration) return replyEmbed(ctx, "error", "Durée invalide", "La durée doit être comprise entre 1 seconde et 28 jours (ex. 15m, 2h, 1d).");
    if (!(await requireBotPermission(ctx, PermissionFlagsBits.ModerateMembers, "Modérer des membres"))) return;
    const target = await resolveMember(ctx, args[0]);
    if (!target) return replyEmbed(ctx, "error", "Membre introuvable", "Mentionne un membre présent sur ce serveur.");
    if (!canModerateTarget(ctx, target) || !target.moderatable) {
      return replyEmbed(ctx, "error", "Action impossible", "Le membre ne peut pas être mis en timeout par le bot.");
    }
    const reason = reasonFrom(args, 2);
    await target.timeout(duration, `${reason} — par ${ctx.member.user.tag}`);
    await ctx.log({ action: "timeout", targetId: target.id, reason, details: formatDuration(duration) });
    return replyEmbed(ctx, "success", "Timeout appliqué", `<@${target.id}> est en timeout pendant **${formatDuration(duration)}**.`, [
      { name: "Raison", value: reason.slice(0, 1024) },
    ]);
  },
};
