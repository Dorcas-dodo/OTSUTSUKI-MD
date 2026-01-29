const fs = require('fs');
const path = require('path');

module.exports = async (sock, chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m || !m.message) return;
        if (m.key.fromMe) return;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        // Extraction du texte (Conversation, Image, Vidéo, etc.)
        const text = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || "";
                     
        const config = require('./config');
        const sender = m.key.participant || m.key.remoteJid;
        const isOwner = sender.includes(config.OWNER_NUMBER);

        // --- 1. SYSTÈME ANTILINK ---
        if (isGroup && config.ANTILINK) {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;
            const isAdmin = participants.find(p => p.id === m.key.participant)?.admin;
            const isBotAdmin = participants.find(p => p.id === (sock.user.id.split(':')[0] + '@s.whatsapp.net'))?.admin;

            if (text.includes("http://") || text.includes("https://") || text.includes("chat.whatsapp.com")) {
                if (!isAdmin) {
                    if (isBotAdmin) {
                        console.log(`🚫 Antilink : Suppression et ban de ${sender}`);
                        await sock.sendMessage(from, { delete: m.key });
                        await sock.groupParticipantsUpdate(from, [m.key.participant], "remove");
                        return await sock.sendMessage(from, { 
                            text: `⚠️ *LOI DES OTSUTSUKI* ⚠️\n\n@${m.key.participant.split('@')[0]} a été banni pour avoir envoyé un lien non autorisé.`, 
                            mentions: [m.key.participant] 
                        });
                    }
                }
            }
        }

        // --- 2. VÉRIFICATION DU MODE (PUBLIC/SELF) ---
        // Si le mode est "self" et que ce n'est pas le proprio, on s'arrête ici
        if (config.MODE === 'self' && !isOwner) return;

        // --- 3. TRAITEMENT DES COMMANDES ---
        const prefix = ".";
        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            console.log(`✨ Exécution de : ${cmdName}`);
            
            // Nettoyage du cache pour charger les modifs en temps réel
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
