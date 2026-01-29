const fs = require('fs');

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const config = require('../config'); // On remonte d'un dossier pour trouver config.js
    
    // Vérification : Seul le propriétaire peut changer le mode
    const sender = m.key.participant || m.key.remoteJid;
    const isOwner = sender.includes(config.OWNER_NUMBER); 

    if (!isOwner) return sock.sendMessage(from, { text: "Seul le Grand Maître Otsutsuki peut changer le mode du système. ❌" });

    if (!args[0]) return sock.sendMessage(from, { text: "Utilisation : *.mode public* ou *.mode self*" });

    if (args[0].toLowerCase() === 'public') {
        config.MODE = 'public';
        await sock.sendMessage(from, { text: "🌐 *MODE SYSTÈME* : PUBLIC\n\nTous les Shinobis peuvent désormais interagir avec l'Otsutsuki-MD. ✅" });
    } else if (args[0].toLowerCase() === 'self' || args[0].toLowerCase() === 'privé') {
        config.MODE = 'self';
        await sock.sendMessage(from, { text: "🔐 *MODE SYSTÈME* : PRIVÉ\n\nLe bot ne répondra désormais qu'au propriétaire. 🌑" });
    } else {
        await sock.sendMessage(from, { text: "Option invalide. Choisissez *public* ou *self*." });
    }
};
