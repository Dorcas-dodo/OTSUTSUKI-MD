module.exports = {
    // 🔗 Connexion & Sécurité
    SESSION_ID: process.env.SESSION_ID || "", 
    PREFIXE: process.env.PREFIXE || ".",
    OWNER_NAME: process.env.OWNER_NAME || "Indra Otsutsuki",
    
    // On s'assure que le numéro est bien nettoyé dès le départ
    OWNER_NUMBER: (process.env.OWNER_NUMBER || "242068079834").replace(/[^0-9]/g, ''),

    // ⚙️ Paramètres de fonctionnement
    // CHANGÉ : 'public' permet au bot de répondre à tout le monde dans les groupes
    MODE: process.env.MODE || "public", 
    
    // 🛡️ Protections & Automatisations
    WELCOME: process.env.WELCOME === "true", 
    GOODBYE: process.env.GOODBYE === "true", 
    ANTILINK: process.env.ANTILINK === "true",
    
    // 👁️ Fonctions de visibilité
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS === "true", 
    // CHANGÉ : Mis sur "true" pour assurer que le bot détecte bien les commandes
    AUTO_READ_MESSAGES: process.env.AUTO_READ_MESSAGES || "true", 
    AUTO_TYPING: process.env.AUTO_TYPING === "true", 
    
    // 💾 Base de Données (Mongoose)
    DATABASE_URL: process.env.DATABASE_URL || "", 
    DATABASE: process.env.DATABASE || "Otsutsuki_DB",

    // 🎨 Identité & Médias
    BOT_NAME: process.env.BOT_NAME || "OTSUTSUKI-MD",
    MENU_IMG: process.env.MENU_IMG || "https://wallpapercave.com/wp/wp9113171.jpg",
    URL_RECURS: "https://files.catbox.moe/dyox3v.jpg",
    
    // 📢 Liens de la communauté
    GCH: process.env.GCH || "https://whatsapp.com/channel/0029VbAoFIMA2pL9Tv1omN2K", 
    DEV_WA: "242068079834", 

    // 🕒 Réglages Régionaux
    TIMEZONE: process.env.TIMEZONE || "Africa/Brazzaville"
};
