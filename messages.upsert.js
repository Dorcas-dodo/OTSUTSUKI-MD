const fs = require('fs');
const path = require('path');

module.exports = async (sock, chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m || !m.message) return;
        if (m.key.fromMe) return;

        const from = m.key.remoteJid;
        // On récupère le texte peu importe le type de message
        const text = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || "";
                     
        const prefix = ".";

        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        
        // Chemin absolu vers le dossier commands
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            console.log(`✨ Exécution de : ${cmdName}`);
            
            // OPTIMISATION : Supprimer le cache pour recharger le fichier proprement
            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            
            // Exécution selon le format d'export
            if (typeof command === 'function') {
                await command(sock, m, args);
            } else if (command.execute) {
                await command.execute(sock, m, args);
            } else if (command.run) {
                await command.run(sock, m, args);
            }
        } else {
            console.log(`❓ Commande inconnue : ${cmdName}`);
            // Optionnel : décommenter pour informer l'utilisateur
            // await sock.sendMessage(from, { text: `*${cmdName}* n'existe pas dans la base Otsutsuki.` });
        }

    } catch (err) {
        console.error("⚠️ Erreur Handler :", err);
        // Optionnel : envoyer l'erreur sur WhatsApp pour débugger plus vite
        // const from = chatUpdate.messages[0].key.remoteJid;
        // await sock.sendMessage(from, { text: "Une erreur est survenue dans le traitement de la commande." });
    }
};
