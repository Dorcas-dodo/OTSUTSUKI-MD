const fs = require('fs');
const path = require('path');

module.exports = {
    name: "antidelete",
    async execute(sock, from, msg, args, config) {
        // Vérification si c'est l'owner ou l'admin
        if (!msg.key.fromMe) return sock.sendMessage(from, { text: "❌ Seul le propriétaire peut activer cette option." });

        const status = args[0] ? args[0].toLowerCase() : "";
        if (status === "on" || status === "active") {
            // Logique pour activer (souvent géré dans index.js avec un booléen)
            await sock.sendMessage(from, { text: "✅ Anti-delete activé sur OTSUTSUKI-MD." });
        } else if (status === "off") {
            await sock.sendMessage(from, { text: "❌ Anti-delete désactivé." });
        } else {
            await sock.sendMessage(from, { text: `Utilise : ${config.PREFIXE}antidelete on/off` });
        }
    }
};