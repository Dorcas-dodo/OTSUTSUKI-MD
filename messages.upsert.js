const fs = require('fs');
const path = require('path');

module.exports = async (sock, chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m || !m.message) return;

        const from = m.key.remoteJid;
        
        // --- 🟢 DÉFINITION DE M.REPLY ---
        m.reply = async (text, options = {}) => {
            return await sock.sendMessage(from, { 
                text: text, 
                mentions: options.mentions || [] 
            }, { quoted: m });
        };

        const isGroup = from.endsWith('@g.us');
        m.isGroup = isGroup; 
        
        const text = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || "";
                     
        const config = require('./config');
        const sender = m.key.participant || m.key.remoteJid;

        // --- 🔎 RECONNAISSANCE MAÎTRE ---
        const cleanSender = sender.split('@')[0].replace(/[^0-9]/g, '');
        const master1 = '242066969267';
        const master2 = '225232933638352'; 
        const isOwner = m.key.fromMe || cleanSender === master1 || cleanSender === master2;

        // --- 🛡️ VÉRIFICATION DES DROITS (LOGIQUE INTÉGRÉE) ---
        let isBotAdmin = false;
        let isSenderAdmin = false;

        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants;
                const botId = sock.user.id.split(':')[0];
                const senderId = sender.split(':')[0];

                // On cherche directement dans la liste des participants
                const bot = participants.find(p => p.id.startsWith(botId));
                const user = participants.find(p => p.id.startsWith(senderId));

                isBotAdmin = !!(bot && bot.admin !== null);
                isSenderAdmin = !!(user && user.admin !== null);

                console.log(`🛡️ [ADMIN] Bot: ${isBotAdmin} | User: ${isSenderAdmin}`);
            } catch (e) {
                console.error("Erreur Metadata:", e);
            }
        }

        // --- 1. SYSTÈME ANTILINK ---
        if (isGroup && config.ANTILINK === "true" && isBotAdmin) {
            const linkPattern = /https?:\/\/\S+|chat\.whatsapp\.com\/\S+/i;
            if (linkPattern.test(text) && !isSenderAdmin && !isOwner) {
                await sock.sendMessage(from, { delete: m.key });
                await sock.groupParticipantsUpdate(from, [sender], "remove");
                return;
            }
        }

        if (config.MODE === 'self' && !isOwner) return;

        // --- 3. TRAITEMENT DES COMMANDES ---
        const prefix = config.PREFIXE || ".";
        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            await sock.sendMessage(from, { react: { text: "🌀", key: m.key } });
            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            
            try {
                const cmdOptions = { isOwner, isBotAdmin, isSenderAdmin, from, sender, args };
                
                if (typeof command === 'function') {
                    await command(sock, m, args, cmdOptions);
                } else if (command.execute) {
                    await command.execute(sock, m, args, cmdOptions);
                }
                
                await sock.sendMessage(from, { react: { text: "", key: m.key } });
            } catch (cmdErr) {
                console.error(cmdErr);
                await m.reply(`⛩️ *Erreur* : ${cmdErr.message}`);
            }
        }
    } catch (err) {
        console.error("⚠️ Erreur Global :", err);
    }
};
