import { parseDiscordId } from "./parse.js";

export async function resolveMember(ctx, token) {
  const id = parseDiscordId(token);
  if (!id) return null;
  try {
    return await ctx.guild.members.fetch(id);
  } catch {
    return null;
  }
}

export async function resolveUser(ctx, token) {
  const id = parseDiscordId(token);
  if (!id) return null;
  try {
    return await ctx.client.users.fetch(id);
  } catch {
    return null;
  }
}

export async function resolveRole(ctx, token) {
  const id = parseDiscordId(token);
  if (!id) return null;
  return ctx.guild.roles.cache.get(id) ?? null;
}

export function resolveChannel(ctx, token) {
  const id = parseDiscordId(token);
  if (!id) return null;
  return ctx.guild.channels.cache.get(id) ?? null;
}
