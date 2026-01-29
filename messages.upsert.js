const fs = require('fs');
const path = require('path');

module.exports = async (sock, chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m || !m.message) return;
        if (m.key.fromMe) return;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        // Extraction du texte
        const text = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || "";
                     
        const config = require('./config');

        // --- SYSTÈME ANTILINK (VÉRIFICATION AVANT TOUT) ---
        if (isGroup && config.ANTILINK) {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;
            
            // Vérifier si l'envoyeur est admin
            const isAdmin = participants.find(p => p.id === m.key.participant)?.admin;
            // Vérifier si le bot est admin
            const isBotAdmin = participants.find(p => p.id === (sock.user.id.split(':')[0] + '@s.whatsapp.net'))?.admin;

            // Détection de lien
            if (text.includes("http://") || text.includes("https://") || text.includes("chat.whatsapp.com")) {
                if (!isAdmin) {
                    if (isBotAdmin) {
                        console.log(`🚫 Lien détecté - Suppression et ban de : ${m.key.participant}`);
                        
                        // 1. Supprimer le message
                        await sock.sendMessage(from, { delete: m.key });
                        
                        // 2. Expulser le membre
                        await sock.groupParticipantsUpdate(from, [m.key.participant], "remove");
                        
                        // 3. Informer le groupe
                        return await sock.sendMessage(from, { 
                            text: `⚠️ *LOI DES OTSUTSUKI* ⚠️\n\n@${m.key.participant.split('@')[0]} a été banni pour avoir envoyé un lien non autorisé.`, 
                            mentions: [m.key.participant] 
                        });
                    } else {
                        console.log("⚠️ Antilink : Le bot doit être admin pour bannir.");
                    }
                }
            }
        }

        // --- TRAITEMENT DES COMMANDES ---
        const prefix = ".";
        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            console.log(`✨ Exécution de : ${cmdName}`);
            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            
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
