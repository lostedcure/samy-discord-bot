import { replyEmbed } from "../lib/embeds.js";

export default {
  name: "help",
  description: "Afficher les commandes disponibles.",
  async execute(ctx) {
    const commands = [
      ["ban", "Bannir un membre"],
      ["bl / unbl", "Gérer la blacklist"],
      ["unban / baninfo", "Consulter ou retirer un bannissement"],
      ["blinfo", "Consulter une entrée blacklist"],
      ["clear", "Supprimer un nombre de messages"],
      ["wipe / unwipe", "Vider un salon / restaurer sa configuration"],
      ["renew", "Recréer un salon vide"],
      ["addrole", "Attribuer un rôle"],
      ["kick", "Expulser un membre"],
      ["to", "Appliquer un timeout"],
      ["wlbot", "Gérer la whitelist des bots"],
      ["setlog", "Configurer les logs"],
      ["roleallow / roleremove / rolelist", "Gérer les rôles autorisés"],
    ];
    return replyEmbed(
      ctx,
      "info",
      "Commandes du bot",
      `${commands.map(([command, description]) => `**${command.split(" / ").map((name) => `\`${ctx.prefix}${name}\``).join(" / ")}** — ${description}`).join("\n")}\n\nLes opérations irréversibles demandent \`CONFIRMER\`. Les raisons sont facultatives lorsqu'elles ne sont pas indiquées comme obligatoires.`,
    );
  },
};
