import { PermissionFlagsBits } from "discord.js";
import { logAction } from "../lib/logging.js";

export async function handleGuildMemberAdd(member, { client, repository, config, logger = console }) {
  if (!member?.guild || !member.user) return;
  if (member.id === client.user.id) return;

  const ctx = {
    client,
    config,
    guild: member.guild,
    actorId: client.user.id,
    repository,
  };

  if (member.user.bot) {
    let isAllowed;
    try {
      isAllowed = await repository.isWhitelisted(member.guild.id, member.id);
    } catch (error) {
      logger.error("Whitelist lookup failed; automatic removal skipped:", error.message);
      await logAction(ctx, {
        action: "bot_whitelist_check_failed",
        targetId: member.id,
        success: false,
        details: "Le bot n'a pas été expulsé, car la whitelist n'a pas pu être vérifiée.",
      });
      return;
    }

    if (isAllowed) return;
    const botMember = member.guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.KickMembers) || !member.kickable) {
      await logAction(ctx, {
        action: "unapproved_bot_not_removed",
        targetId: member.id,
        success: false,
        details: "Permission d'expulsion manquante ou hiérarchie de rôles insuffisante.",
      });
      return;
    }

    try {
      await member.kick("Bot absent de la whitelist du serveur");
      await logAction(ctx, {
        action: "unapproved_bot_removed",
        targetId: member.id,
        details: "Expulsion automatique après vérification de la whitelist.",
      });
    } catch (error) {
      logger.error("Could not remove an unapproved bot:", error.message);
      await logAction(ctx, {
        action: "unapproved_bot_removal_failed",
        targetId: member.id,
        success: false,
        details: error.code ? `Discord error ${error.code}` : "Discord a refusé l'expulsion.",
      });
    }
    return;
  }

  let entry;
  try {
    entry = await repository.getBlacklistedUser(member.guild.id, member.id);
  } catch (error) {
    logger.error("Blacklist lookup failed; automatic ban skipped:", error.message);
    return;
  }
  if (!entry) return;

  const botMember = member.guild.members.me;
  if (!botMember?.permissions.has(PermissionFlagsBits.BanMembers) || !member.bannable) {
    await logAction(ctx, {
      action: "blacklisted_user_not_banned",
      targetId: member.id,
      reason: entry.reason,
      success: false,
      details: "Permission de bannissement manquante ou hiérarchie de rôles insuffisante.",
    });
    return;
  }

  try {
    await member.ban({ reason: `Blacklist du serveur : ${entry.reason}` });
    await logAction(ctx, {
      action: "blacklisted_user_banned",
      targetId: member.id,
      reason: entry.reason,
      details: "Bannissement automatique à l'arrivée.",
    });
  } catch (error) {
    logger.error("Could not ban a blacklisted member:", error.message);
    await logAction(ctx, {
      action: "blacklisted_user_ban_failed",
      targetId: member.id,
      reason: entry.reason,
      success: false,
      details: error.code ? `Discord error ${error.code}` : "Discord a refusé le bannissement.",
    });
  }
}
