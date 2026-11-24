# Bot Discord professionnel

Bot de modération en JavaScript avec Discord.js v14. Toutes les commandes sont des messages de préfixe : il n'y a aucun enregistrement ni traitement de commandes slash. Le préfixe est `+` par défaut et peut être modifié avec `BOT_PREFIX`.

## Démarrage

1. Dans les secrets Replit, renseigne `DISCORD_TOKEN`. La base PostgreSQL du projet fournit `DATABASE_URL`.
2. Applique le schéma à la base de développement :

   ```sh
   pnpm --filter @workspace/db run push
   ```

3. Dans le Discord Developer Portal, active **Message Content Intent** et **Server Members Intent** dans les intents privilégiés.
4. Invite le bot avec le scope `bot` uniquement (pas `applications.commands`) et les permissions nécessaires à tes commandes.
5. Démarre le workflow **Discord Bot** ou lance :

   ```sh
   pnpm --filter @workspace/scripts run discord-bot
   ```

Le bot demande au minimum les permissions Discord utiles à ses fonctions : voir les salons, envoyer des messages, intégrer des liens, lire l'historique, bannir/expulser/modérer des membres, gérer les messages, les rôles et les salons. N'accorde pas Administrator si ces permissions ciblées suffisent.

## Commandes

Toutes les syntaxes ci-dessous supposent le préfixe `+`.

| Commande | Syntaxe | Permission |
| --- | --- | --- |
| `ban` | `+ban @membre [raison]` | Bannir des membres |
| `bl` | `+bl @utilisateur [raison]` | Gérer le serveur |
| `unban` | `+unban identifiant [raison]` | Bannir des membres |
| `unbl` | `+unbl identifiant` | Gérer le serveur |
| `wipe` | `+wipe #salon CONFIRMER` | Gérer les messages |
| `unwipe` | `+unwipe #salon` | Gérer les salons |
| `blinfo` | `+blinfo identifiant` | Gérer le serveur |
| `baninfo` | `+baninfo identifiant` | Bannir des membres |
| `clear` | `+clear 1-100` | Gérer les messages |
| `addrole` | `+addrole @membre @rôle [raison]` | Gérer les rôles |
| `renew` | `+renew #salon CONFIRMER` | Gérer les salons |
| `kick` | `+kick @membre [raison]` | Expulser des membres |
| `to` | `+to @membre 15m [raison]` | Modérer des membres |
| `wlbot` | `+wlbot add/remove/list/info/clear ...` | Gérer le serveur |
| `setlog` | `+setlog #salon` / `+setlog off` | Gérer le serveur |
| `roleallow` | `+roleallow @rôle` | Propriétaire ou administrateur |
| `roleremove` | `+roleremove @rôle` | Propriétaire ou administrateur |
| `rolelist` | `+rolelist` | Propriétaire ou administrateur |
| `help` | `+help` | Tout le monde |

`+wlbot clear` exige `+wlbot clear CONFIRMER`. Le bot principal est protégé : la commande de retrait et la suppression globale de la whitelist ne peuvent pas l'enlever.

Le système vérifie les nouveaux bots avec `GuildMemberAdd`. Un bot autorisé n'est jamais expulsé. En cas d'indisponibilité de la base, le bot n'expulse personne. Les expulsions automatiques sont aussi journalisées.

## Rôles autorisés et logs

- Un propriétaire ou administrateur ajoute les rôles avec `+roleallow @rôle`, les retire avec `+roleremove @rôle` et consulte la liste avec `+rolelist`.
- Les administrateurs et ces rôles peuvent gérer la whitelist et les commandes de modération. Les permissions du bot et la hiérarchie Discord restent toujours vérifiées.
- Configure les logs par serveur avec `+setlog #salon`. `LOG_CHANNEL_ID` peut aussi servir de salon de secours commun.

## Actions irréversibles

- `+wipe` requiert `CONFIRMER`, sauvegarde les paramètres du salon et supprime au plus 5 000 messages. Les messages supprimés ne sont pas récupérables.
- `+unwipe` restaure les paramètres sauvegardés (nom, sujet, catégorie, permissions et réglages), **pas l'historique des messages**.
- `+renew` requiert `CONFIRMER`, supprime le salon puis en crée un nouveau avec la configuration sauvegardée. Son identifiant change et son ancien historique est perdu.
- `+clear` accepte 1 à 100 messages. Discord ne permet pas leur suppression groupée lorsqu'ils ont plus de 14 jours.
- `+to` accepte les secondes (`s`), minutes (`m`), heures (`h`) et jours (`d`), jusqu'à 28 jours.

## Vérification

```sh
pnpm --filter @workspace/scripts run discord-bot:test
pnpm run typecheck
```

Les tests automatisés utilisent des objets Discord simulés : ils ne se connectent pas à un serveur et ne réalisent aucune expulsion réelle.
