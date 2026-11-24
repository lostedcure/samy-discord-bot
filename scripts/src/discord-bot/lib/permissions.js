import { PermissionFlagsBits } from "discord.js";
import { replyEmbed } from "./embeds.js";

const PRIVILEGED_PERMISSIONS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
];

export async function isAuthorized(ctx, requiredPermission) {
  if (!ctx.member || !ctx.guild) return false;
  if (ctx.guild.ownerId === ctx.member.id) return true;

  const permissions = ctx.member.permissions;
  if (PRIVILEGED_PERMISSIONS.some((permission) => permissions.has(permission))) {
    return true;
  }

  const roleIds = await ctx.repository.listAuthorizedRoles(ctx.guild.id);
  if (ctx.member.roles.cache.some((role) => roleIds.includes(role.id))) return true;
  return Boolean(requiredPermission && permissions.has(requiredPermission));
}

export function isGuildAdmin(ctx) {
  return Boolean(
    ctx.member &&
      ctx.guild &&
      (ctx.guild.ownerId === ctx.member.id ||
        ctx.member.permissions.has(PermissionFlagsBits.Administrator) ||
        ctx.member.permissions.has(PermissionFlagsBits.ManageGuild)),
  );
}

export async function requireGuildAdmin(ctx) {
  if (isGuildAdmin(ctx)) return true;
  await replyEmbed(ctx, "error", "Permission refusée", "Seuls le propriétaire et les administrateurs du serveur peuvent modifier les rôles autorisés.");
  return false;
}

export async function requirePermission(ctx, permission) {
  if (await isAuthorized(ctx, permission)) return true;
  await replyEmbed(
    ctx,
    "error",
    "Permission refusée",
    "Cette commande est réservée au propriétaire du serveur, aux administrateurs ou aux membres autorisés.",
  );
  return false;
}

export function botHasPermission(ctx, permission) {
  const me = ctx.guild.members.me;
  return Boolean(me?.permissions.has(permission));
}

export function canModerateTarget(ctx, target) {
  const me = ctx.guild.members.me;
  if (!me || !target || target.id === ctx.guild.ownerId) return false;
  if (target.id === ctx.client.user.id || target.id === ctx.member.id) return false;
  return Boolean(target.manageable);
}

export async function requireBotPermission(ctx, permission, label) {
  if (botHasPermission(ctx, permission)) return true;
  await replyEmbed(ctx, "error", "Permission du bot manquante", `Le bot doit avoir la permission « ${label} ».`);
  return false;
}
