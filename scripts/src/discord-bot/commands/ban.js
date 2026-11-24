import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "../lib/embeds.js";
import { requireBotPermission, requirePermission, canModerateTarget } from "../lib/permissions.js";
import { reasonFrom } from "../lib/parse.js";
import { resolveMember } from "../lib/targets.js";

export default {
  name: "ban",
  description: "Bannir un membre.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.BanMembers))) return;
    if (!args[0]) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}ban @membre [raison]\``);
    if (!(await requireBotPermission(ctx, PermissionFlagsBits.BanMembers, "Bannir des membres"))) return;
    const target = await resolveMember(ctx, args[0]);
    if (!target) return replyEmbed(ctx, "error", "Membre introuvable", "Mentionne un membre présent sur ce serveur.");
    if (!canModerateTarget(ctx, target)) {
      return replyEmbed(ctx, "error", "Action impossible", "Le membre est le propriétaire, le bot, toi-même ou possède un rôle supérieur au bot.");
    }
    const reason = reasonFrom(args, 1);
    await target.ban({ reason: `${reason} — par ${ctx.member.user.tag}` });
    await ctx.log({ action: "ban", targetId: target.id, reason });
    return replyEmbed(ctx, "success", "Membre banni", `<@${target.id}> a été banni.`, [
      { name: "Raison", value: reason.slice(0, 1024) },
    ]);
  },
};
