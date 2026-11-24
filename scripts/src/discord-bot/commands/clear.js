import { PermissionFlagsBits } from "discord.js";
import { makeEmbed, replyEmbed } from "../lib/embeds.js";
import { requireBotPermission, requirePermission } from "../lib/permissions.js";

export default {
  name: "clear",
  description: "Supprimer un nombre précis de messages (1 à 100).",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.ManageMessages))) return;
    const amount = Number(args[0]);
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}clear 1-100\``);
    }
    if (!ctx.message.channel?.bulkDelete) {
      return replyEmbed(ctx, "error", "Salon incompatible", "Cette commande doit être exécutée dans un salon textuel.");
    }
    if (!(await requireBotPermission(ctx, PermissionFlagsBits.ManageMessages, "Gérer les messages"))) return;
    const deleted = await ctx.message.channel.bulkDelete(amount, true);
    await ctx.log({ action: "message_clear", targetId: ctx.message.channel.id, details: `${deleted.size} message(s) supprimé(s).` });
    const embed = makeEmbed("success", "Nettoyage effectué", `${deleted.size} message(s) supprimé(s). Les messages de plus de 14 jours ne peuvent pas être supprimés en groupe.`);
    return ctx.message.channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  },
};
