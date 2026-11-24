# Bot Discord professionnel

Bot Discord de modération en JavaScript, avec commandes préfixées, logs et whitelist persistante des bots.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/scripts run discord-bot` — start the Discord bot
- `pnpm --filter @workspace/scripts run discord-bot:test` — test the Discord bot commands
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `DISCORD_TOKEN`
- Optional env: `BOT_PREFIX` (default `+`), `LOG_CHANNEL_ID`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `scripts/src/discord-bot/` — bot entry point, command handlers, persistence and tests
- `lib/db/src/schema/discord-bot.ts` — persistent Discord bot tables

## Architecture decisions

- All Discord commands are message-prefix commands; no slash-command registration is used.
- Whitelist checks fail closed: a database error never triggers an automatic bot kick.
- Channel message deletion cannot be undone; `+unwipe` restores saved channel settings only.

## Product

Moderation commands, role-based authorization, audit logging, persistent user blacklist and bot whitelist. Unapproved bots are removed on join when the bot has the required Discord permissions.

## User preferences

- Use JavaScript and Discord.js v14; default command prefix is `+`.
- Never add slash commands.

## Gotchas

- Enable Message Content Intent and Server Members Intent in the Discord Developer Portal.
- Apply new database tables to development with `pnpm --filter @workspace/db run push`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
