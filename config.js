module.exports = {
    // 🔗 Connexion & Sécurité
    SESSION_ID: process.env.SESSION_ID || "", 
    PREFIXE: process.env.PREFIXE || ".",
    OWNER_NAME: process.env.OWNER_NAME || "Indra Otsutsuki",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "242066969267",

    // ⚙️ Paramètres de fonctionnement
    // 'public' : tout le monde peut utiliser le bot
    // 'private' ou 'self' : seul l'owner peut l'utiliser
    MODE: process.env.MODE || "public", 
    
    // 🛡️ Protections & Automatisations
    WELCOME: process.env.WELCOME === "true", // Conversion en booléen
    GOODBYE: process.env.GOODBYE === "true", 
    ANTILINK: process.env.ANTILINK === "true",
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS === "true", // Moderne
    
    // 💾 Base de Données
    DATABASE_URL: process.env.DATABASE_URL || "votre_lien_mongodb_ici",
    
    // 🎨 Identité & Médias
    BOT_NAME: process.env.BOT_NAME || "OTSUTSUKI-MD",
    MENU_IMG: process.env.MENU_IMG || "./media/menu.jpg",
    URL_RECURS: "https://files.catbox.moe/dyox3v.jpg",

    // 🕒 Autres réglages
    TIMEZONE: process.env.TIMEZONE || "Africa/Brazzaville"
};
