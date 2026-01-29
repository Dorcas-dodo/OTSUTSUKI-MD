const fs = require('fs');
const path = require('path');

module.exports = async (sock, chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m || !m.message) return;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        const text = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || "";
                     
        const config = require('./config');
        const sender = m.key.participant || m.key.remoteJid;

        // --- 🔎 RECONNAISSANCE MAÎTRE ABSOLUE ---
        const cleanSender = sender.split('@')[0].replace(/[^0-9]/g, '');
        const cleanOwner = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : '';
        
        // Reconnaissance : Scan, Config, ou ton numéro fixe
        const isOwner = m.key.fromMe || cleanSender === cleanOwner || cleanSender === '242066969267';

        // --- 1. SYSTÈME ANTILINK ---
        if (isGroup && config.ANTILINK) {
            const linkPattern = /https?:\/\/\S+|chat\.whatsapp\.com\/\S+/i;
            if (linkPattern.test(text)) {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants;
                const isAdmin = participants.find(p => p.id === sender)?.admin;
                const isBotAdmin = participants.find(p => p.id === (sock.user.id.split(':')[0] + '@s.whatsapp.net'))?.admin;

                if (!isAdmin && isBotAdmin) {
                    await sock.sendMessage(from, { delete: m.key });
                    await sock.groupParticipantsUpdate(from, [sender], "remove");
                    return;
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
            await sock.sendMessage(from, { react: { text: "🌀", key: m.key } });

            console.log(`✨ Activation : ${cmdName} par ${cleanSender}`);
            
            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            
            try {
                // --- 💡 TRANSMISSION DU PASSE-DROIT { isOwner } ---
                if (typeof command === 'function') {
                    await command(sock, m, args, { isOwner });
                } else if (command.execute) {
                    await command.execute(sock, m, args, { isOwner });
                } else if (command.run) {
                    await command.run(sock, m, args, { isOwner });
                }

                await sock.sendMessage(from, { react: { text: "", key: m.key } });

            } catch (cmdErr) {
                console.error(cmdErr);
                await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
            }
        }
    } catch (err) {
        console.error("⚠️ Erreur Handler :", err);
    }
};
