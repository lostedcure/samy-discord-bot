import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "../lib/embeds.js";
import { requirePermission } from "../lib/permissions.js";
import { parseDiscordId } from "../lib/parse.js";
import { resolveUser } from "../lib/targets.js";

export default {
  name: "wlbot",
  description: "Gérer la whitelist des bots du serveur.",
  async execute(ctx, args) {
    if (!(await requirePermission(ctx, PermissionFlagsBits.ManageGuild))) return;
    const [subcommand, targetToken] = args;

    if (subcommand === "add") {
      const user = await resolveUser(ctx, targetToken);
      if (!user) return replyEmbed(ctx, "error", "Bot introuvable", `Syntaxe : \`${ctx.prefix}wlbot add @bot\``);
      if (!user.bot) return replyEmbed(ctx, "error", "Compte invalide", "Seuls les comptes bot peuvent être ajoutés à la whitelist.");
      const entry = await ctx.repository.addWhitelistedBot(ctx.guild.id, user.id, ctx.member.id);
      if (!entry) return replyEmbed(ctx, "info", "Déjà autorisé", `<@${user.id}> est déjà dans la whitelist.`);
      await ctx.log({ action: "bot_whitelist_add", targetId: user.id });
      return replyEmbed(ctx, "success", "Bot autorisé", `<@${user.id}> a été ajouté à la whitelist de ce serveur.`);
    }

    if (subcommand === "remove") {
      const botId = parseDiscordId(targetToken);
      if (!botId) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}wlbot remove @bot\``);
      if (botId === ctx.client.user.id) {
        return replyEmbed(ctx, "error", "Protection active", "Le bot principal ne peut pas être retiré de sa propre whitelist.");
      }
      const removed = await ctx.repository.removeWhitelistedBot(ctx.guild.id, botId);
      if (!removed) return replyEmbed(ctx, "info", "Aucun changement", "Ce bot n'était pas dans la whitelist.");
      await ctx.log({ action: "bot_whitelist_remove", targetId: botId });
      return replyEmbed(ctx, "success", "Bot retiré", `<@${botId}> a été retiré de la whitelist.`);
    }

    if (subcommand === "list") {
      const entries = await ctx.repository.listWhitelistedBots(ctx.guild.id);
      if (!entries.length) return replyEmbed(ctx, "info", "Whitelist vide", "Aucun bot n'est actuellement autorisé sur ce serveur.");
      for (let offset = 0; offset < entries.length; offset += 20) {
        const page = entries.slice(offset, offset + 20);
        await replyEmbed(
          ctx,
          "info",
          `Bots autorisés (${offset + 1}–${offset + page.length}/${entries.length})`,
          page.map((entry) => `• <@${entry.bot_user_id}> — ajouté le ${new Date(entry.added_at).toLocaleDateString("fr-FR")}`).join("\n"),
        );
      }
      return;
    }

    if (subcommand === "info") {
      const botId = parseDiscordId(targetToken);
      if (!botId) return replyEmbed(ctx, "error", "Utilisation", `Syntaxe : \`${ctx.prefix}wlbot info @bot\``);
      const entry = await ctx.repository.getWhitelistedBot(ctx.guild.id, botId);
      if (!entry) return replyEmbed(ctx, "info", "Bot non autorisé", "Aucune entrée de whitelist ne correspond à cet identifiant.");
      const user = await resolveUser(ctx, botId);
      return replyEmbed(
        ctx,
        "info",
        "Informations du bot",
        `**Compte :** ${user?.tag ?? `<@${botId}>`}\n**Identifiant :** \`${botId}\``,
        [
          { name: "Ajouté par", value: `<@${entry.added_by}>`, inline: true },
          { name: "Ajouté le", value: new Date(entry.added_at).toLocaleString("fr-FR"), inline: true },
        ],
      );
    }

    if (subcommand === "clear") {
      if (targetToken !== "CONFIRMER") {
        return replyEmbed(ctx, "warning", "Confirmation requise", `Cette action vide la whitelist du serveur. Relance avec \`${ctx.prefix}wlbot clear CONFIRMER\`.`);
      }
      const removedCount = await ctx.repository.clearWhitelistedBots(ctx.guild.id, ctx.client.user.id);
      await ctx.log({ action: "bot_whitelist_clear", details: `${removedCount} bot(s) retiré(s); le bot principal est protégé.` });
      return replyEmbed(
        ctx,
        "success",
        "Whitelist vidée",
        `${removedCount} entrée(s) retirée(s). Le bot principal est protégé et ne peut pas être supprimé par cette commande.`,
      );
    }

    return replyEmbed(
      ctx,
      "info",
      "Gestion de la whitelist",
      [
        `\`${ctx.prefix}wlbot add @bot\` — autoriser un bot`,
        `\`${ctx.prefix}wlbot remove @bot\` — retirer un bot`,
        `\`${ctx.prefix}wlbot list\` — afficher la liste`,
        `\`${ctx.prefix}wlbot info @bot\` — voir une entrée`,
        `\`${ctx.prefix}wlbot clear CONFIRMER\` — vider la liste`,
      ].join("\n"),
    );
  },
};
