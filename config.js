module.exports = {
    // Paramètres de base
    SESSION_ID: process.env.SESSION_ID || "", 
    PREFIXE: process.env.PREFIXE || ".",
    OWNER_NAME: process.env.NOM_OWNER || "Dorcas-dodo",
    OWNER_NUMBER: process.env.NUMERO_OWNER || "242068079834", // Ton numéro mis à jour ✅

    // Paramètres de fonctionnement
    MODE: process.env.MODE || "public", // public ou self
    WELCOME: process.env.WELCOME || "true", // true ou false
    GOODBYE: process.env.GOODBYE || "true", // true ou false
    ANTILINK: process.env.ANTILINK || "true", // true ou false
    
    // Autres infos
    BOT_NAME: "OTSUTSUKI-MD",
    MENU_IMG: "https://raw.githubusercontent.com/Dorcas-dodo/OTSUTSUKI-MD/master/media/menu.jpg"
};
