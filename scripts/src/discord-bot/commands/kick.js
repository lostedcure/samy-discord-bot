import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "../lib/embeds.js";
import { canModerateTarget, requireBotPermission, requirePermission } from "../lib/permissions.js";
import { reasonFrom } from "../lib/parse.js";
import { resolveMember } from "../lib/targets.js";

export default {
  name: "kick",
  description: "Expulser un membre du serveur.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.KickMembers))) return;
    if (!args[0]) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}kick @membre [raison]\``);
    if (!(await requireBotPermission(ctx, PermissionFlagsBits.KickMembers, "Expulser des membres"))) return;
    const target = await resolveMember(ctx, args[0]);
    if (!target) return replyEmbed(ctx, "error", "Membre introuvable", "Mentionne un membre présent sur ce serveur.");
    if (!canModerateTarget(ctx, target) || !target.kickable) {
      return replyEmbed(ctx, "error", "Action impossible", "Le membre ne peut pas être expulsé par le bot.");
    }
    const reason = reasonFrom(args, 1);
    await target.kick(`${reason} — par ${ctx.member.user.tag}`);
    await ctx.log({ action: "kick", targetId: target.id, reason });
    return replyEmbed(ctx, "success", "Membre expulsé", `<@${target.id}> a été expulsé.`, [
      { name: "Raison", value: reason.slice(0, 1024) },
    ]);
  },
};
