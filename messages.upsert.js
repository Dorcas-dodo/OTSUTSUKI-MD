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

        // --- 🔎 RECONNAISSANCE MAÎTRE ULTRA-FLEXIBLE ---
        const cleanSender = sender.split('@')[0].replace(/[^0-9]/g, '');
        
        const master1 = '242066969267';
        const master2 = '225232933638352'; // Détecté dans tes logs !
        const cleanOwner = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : master1;
        
        const isOwner = m.key.fromMe || 
                        cleanSender.includes(master1) || 
                        cleanSender.includes(master2) || 
                        cleanSender.includes(cleanOwner);

        // --- 🚫 VÉRIFICATION DU BANNISSEMENT (Sauf pour le Maître) ---
        const bannedPath = './data/banned.json';
        if (fs.existsSync(bannedPath) && !isOwner) {
            const bannedList = JSON.parse(fs.readFileSync(bannedPath, 'utf-8'));
            if (bannedList.includes(sender)) return;
        }

        // --- 1. SYSTÈME ANTILINK ---
        if (isGroup && config.ANTILINK === "true") {
            const linkPattern = /https?:\/\/\S+|chat\.whatsapp\.com\/\S+/i;
            if (linkPattern.test(text)) {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants;
                const isAdmin = participants.find(p => p.id === sender)?.admin;
                const botId = (sock.user.id.split(':')[0] + '@s.whatsapp.net');
                const isBotAdmin = participants.find(p => p.id === botId)?.admin;

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

        // ✅ Correction de la ligne qui causait l'erreur
        const args = text.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            await sock.sendMessage(from, { react: { text: "🌀", key: m.key } });

            console.log(`✨ Activation : ${cmdName} par ${cleanSender} | Master: ${isOwner}`);
            
            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            
            try {
                // Transmission du passe-droit { isOwner }
                if (typeof command === 'function') {
                    await command(sock, m, args, { isOwner });
                } else if (command.execute) {
                    await command.execute(sock, m, args, { isOwner });
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
