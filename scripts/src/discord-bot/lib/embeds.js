import { EmbedBuilder } from "discord.js";

const COLORS = {
  success: 0x168a61,
  error: 0xc74747,
  info: 0x4169e1,
  warning: 0xd18b18,
};

export function makeEmbed(kind, title, description) {
  return new EmbedBuilder()
    .setColor(COLORS[kind] ?? COLORS.info)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

export async function replyEmbed(ctx, kind, title, description, fields = []) {
  const embed = makeEmbed(kind, title, description);
  if (fields.length) embed.addFields(fields);
  return ctx.message.reply({ embeds: [embed], allowedMentions: { parse: [] } });
}
