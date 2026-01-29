const fs = require('fs');
const path = require('path');

module.exports = async (sock, chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m || !m.message) return;
        if (m.key.fromMe) return;

        const from = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
        const prefix = ".";

        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        
        // Chemin vers le fichier de la commande
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            console.log(`✨ Exécution de : ${cmdName}`);
            const command = require(commandPath);
            
            // On essaie d'exécuter la commande (gestion des différents formats d'exports)
            if (typeof command === 'function') {
                await command(sock, m, args);
            } else if (command.execute) {
                await command.execute(sock, m, args);
            } else if (command.run) {
                await command.run(sock, m, args);
            }
        } else {
            console.log(`❓ Commande inconnue : ${cmdName}`);
        }

    } catch (err) {
        console.error("⚠️ Erreur Handler :", err);
    }
};
