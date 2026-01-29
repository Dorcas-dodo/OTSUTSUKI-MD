module.exports = {
    // 🔗 Paramètres de base
    SESSION_ID: process.env.SESSION_ID || "", 
    PREFIXE: process.env.PREFIXE || ".",
    OWNER_NAME: process.env.NOM_OWNER || "Indra Otsutsuki",
    OWNER_NUMBER: process.env.NUMERO_OWNER || "242068079834, 242066969267",

    // ⚙️ Paramètres de fonctionnement
    MODE: process.env.MODE || "public", // 'public' ou 'self'
    WELCOME: process.env.WELCOME || "true", 
    GOODBYE: process.env.GOODBYE || "true", 
    ANTILINK: process.env.ANTILINK || "true", 
    
    // 🎨 Identité & Médias
    BOT_NAME: "OTSUTSUKI-MD",
    
    // Optimisation : Utilisation du fichier local pour plus de rapidité sur Koyeb
    MENU_IMG: "./media/menu.jpg", 
    
    // Lien de secours (si le fichier local échoue)
    URL_RECURS: "https://files.catbox.moe/dyox3v.jpg" 
};


