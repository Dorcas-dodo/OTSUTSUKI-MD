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
    WELCOME: process.env.WELCOME === "true", 
    GOODBYE: process.env.GOODBYE === "true", 
    ANTILINK: process.env.ANTILINK === "true",
    
    // 👁️ Fonctions de visibilité (Moderne)
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS === "true", // Regarde les statuts auto
    AUTO_READ_MESSAGES: process.env.AUTO_READ_MESSAGES === "true", // Coche bleue auto
    AUTO_TYPING: process.env.AUTO_TYPING === "false", // Affiche "écrit..."
    
    // 💾 Base de Données (Mongoose)
    DATABASE_URL: process.env.DATABASE_URL || "mongodb+srv://...", 
    DATABASE: process.env.DATABASE || "Otsutsuki_DB",

    // 🎨 Identité & Médias
    BOT_NAME: process.env.BOT_NAME || "OTSUTSUKI-MD",
    MENU_IMG: process.env.MENU_IMG || "./media/menu.jpg",
    URL_RECURS: "https://files.catbox.moe/dyox3v.jpg",
    
    // 📢 Liens de la communauté
    GCH: process.env.GCH || "https://whatsapp.com/channel/0029VbAoFIMA2pL9Tv1omN2K", // Groupe/Chaîne
    DEV_WA: "242068079834", // Ton numéro direct pour le bouton support

    // 🕒 Réglages Régionaux
    TIMEZONE: process.env.TIMEZONE || "Africa/Brazzaville"
};
