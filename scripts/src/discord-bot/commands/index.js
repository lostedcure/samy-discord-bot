import addrole from "./addrole.js";
import ban from "./ban.js";
import baninfo from "./baninfo.js";
import bl from "./bl.js";
import blinfo from "./blinfo.js";
import clear from "./clear.js";
import help from "./help.js";
import kick from "./kick.js";
import roleallow from "./roleallow.js";
import rolelist from "./rolelist.js";
import roleremove from "./roleremove.js";
import renew from "./renew.js";
import setlog from "./setlog.js";
import to from "./to.js";
import unban from "./unban.js";
import unbl from "./unbl.js";
import unwipe from "./unwipe.js";
import wipe from "./wipe.js";
import wlbot from "./wlbot.js";

export const commands = new Map(
  [
    addrole,
    ban,
    baninfo,
    bl,
    blinfo,
    clear,
    help,
    kick,
    roleallow,
    rolelist,
    roleremove,
    renew,
    setlog,
    to,
    unban,
    unbl,
    unwipe,
    wipe,
    wlbot,
  ].map((command) => [command.name, command]),
);
