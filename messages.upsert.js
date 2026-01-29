const fs = require('fs');
const path = require('path');

module.exports = async (sock, chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m || !m.message) return;

        // --- FIX : Autoriser le bot à répondre à son propre numéro ---
        // if (m.key.fromMe) return; 

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        // Extraction du texte
        const text = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || "";
                     
        const config = require('./config');
        const sender = m.key.participant || m.key.remoteJid;
        const isOwner = sender.includes(config.OWNER_NUMBER) || m.key.fromMe;

        // --- 1. SYSTÈME ANTILINK ---
        if (isGroup && config.ANTILINK) {
            if (text.includes("http://") || text.includes("https://") || text.includes("chat.whatsapp.com")) {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants;
                const isAdmin = participants.find(p => p.id === sender)?.admin;
                const isBotAdmin = participants.find(p => p.id === (sock.user.id.split(':')[0] + '@s.whatsapp.net'))?.admin;

                if (!isAdmin && isBotAdmin) {
                    await sock.sendMessage(from, { delete: m.key });
                    await sock.groupParticipantsUpdate(from, [sender], "remove");
                    return await sock.sendMessage(from, { 
                        text: `⚠️ *LOI DES OTSUTSUKI* ⚠️\n\n@${sender.split('@')[0]} a été banni pour envoi de lien.`, 
                        mentions: [sender] 
                    });
                }
            }
        }

        // --- 2. VÉRIFICATION DU MODE ---
        if (config.MODE === 'self' && !isOwner) return;

        // --- 3. TRAITEMENT DES COMMANDES ---
        const prefix = config.PREFIXE || ".";
        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            // --- AJOUT DE LA RÉACTION (Début) ---
            await sock.sendMessage(from, { react: { text: "🌀", key: m.key } });

            console.log(`✨ Exécution de : ${cmdName}`);
            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            
            try {
                // Support de différents formats d'export de commande
                if (typeof command === 'function') {
                    await command(sock, m, args);
                } else if (command.execute) {
                    await command.execute(sock, m, args);
                } else if (command.run) {
                    await command.run(sock, m, args);
                }

                // --- RETRAIT DE LA RÉACTION (Succès) ---
                await sock.sendMessage(from, { react: { text: "", key: m.key } });

            } catch (cmdErr) {
                console.error(cmdErr);
                await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
            }
        } else {
            console.log(`❓ Commande inconnue : ${cmdName}`);
        }

    } catch (err) {
        console.error("⚠️ Erreur Handler :", err);
    }
};
