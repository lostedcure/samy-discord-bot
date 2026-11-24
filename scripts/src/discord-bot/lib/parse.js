const DISCORD_ID = /^\d{17,20}$/;

export function parseMessageCommand(content, prefix = "+") {
  if (typeof content !== "string" || !content.startsWith(prefix)) return null;
  const input = content.slice(prefix.length).trim();
  if (!input) return null;
  const [command, ...args] = input.split(/\s+/);
  return { command: command.toLowerCase(), args };
}

export function parseDiscordId(input) {
  if (!input) return null;
  const match = input.match(/^<@!?(\d{17,20})>$/) ?? input.match(/^<@&(\d{17,20})>$/) ?? input.match(/^<#(\d{17,20})>$/);
  const id = match?.[1] ?? input;
  return DISCORD_ID.test(id) ? id : null;
}

export function parseDuration(input) {
  const match = /^(\d{1,5})(s|m|h|d)$/i.exec(input ?? "");
  if (!match) return null;
  const value = Number(match[1]);
  const multiplier = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2].toLowerCase()];
  const milliseconds = value * multiplier;
  const maximum = 28 * 86_400_000;
  return value > 0 && milliseconds <= maximum ? milliseconds : null;
}

export function formatDuration(milliseconds) {
  const units = [
    ["j", 86_400_000],
    ["h", 3_600_000],
    ["min", 60_000],
    ["s", 1_000],
  ];
  let remaining = milliseconds;
  const parts = [];
  for (const [label, size] of units) {
    const count = Math.floor(remaining / size);
    if (count > 0) {
      parts.push(`${count}${label}`);
      remaining %= size;
    }
  }
  return parts.join(" ") || "0 s";
}

export function reasonFrom(args, startIndex = 0) {
  const reason = args.slice(startIndex).join(" ").trim();
  return (reason || "Aucune raison fournie.").slice(0, 450);
}
