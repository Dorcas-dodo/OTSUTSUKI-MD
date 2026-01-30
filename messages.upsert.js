const fs = require('fs');
const path = require('path');

module.exports = async (sock, chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m || !m.message) return;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = m.key.participant || m.key.remoteJid;
        
        // --- 🟢 DÉFINITION DE M.REPLY ---
        m.reply = async (text, options = {}) => {
            return await sock.sendMessage(from, { 
                text: text, 
                mentions: options.mentions || [] 
            }, { quoted: m });
        };

        m.isGroup = isGroup; 
        
        const text = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || "";
                     
        const config = require('./config');

        // --- 🔎 RECONNAISSANCE MAÎTRE (OWNER) ---
        const cleanSender = sender.replace(/[^0-9]/g, '');
        const master1 = '242066969267';
        const master2 = '225232933638352'; 
        const isOwner = m.key.fromMe || cleanSender === master1 || cleanSender === master2 || cleanSender === config.OWNER_NUMBER?.replace(/[^0-9]/g, '');

        // --- 🛡️ VÉRIFICATION DES DROITS (ADMINS) ---
        let isBotAdmin = false;
        let isSenderAdmin = false;

        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants;
                const botId = sock.user.id.replace(/[^0-9]/g, '').split(':')[0];

                // Vérification précise des rôles
                const bot = participants.find(p => p.id.replace(/[^0-9]/g, '').startsWith(botId));
                const user = participants.find(p => p.id.replace(/[^0-9]/g, '').startsWith(cleanSender));

                isBotAdmin = !!(bot && (bot.admin === 'admin' || bot.admin === 'superadmin'));
                isSenderAdmin = !!(user && (user.admin === 'admin' || user.admin === 'superadmin'));

                console.log(`🛡️ [GROUPE] BotAdmin: ${isBotAdmin} | SenderAdmin: ${isSenderAdmin}`);
            } catch (e) {
                console.error("Erreur Metadata Admin:", e);
            }
        }

        // --- 🔓 LOGIQUE DE MODE (SELF + RECONNAISSANCE ADMIN) ---
        // Le bot bloque si mode SELF ET que l'utilisateur n'est NI owner NI admin du groupe
        if (config.MODE === 'self' && !isOwner && !isSenderAdmin) return;

        // --- 1. SYSTÈME ANTILINK ---
        if (isGroup && config.ANTILINK === "true" && isBotAdmin) {
            const linkPattern = /https?:\/\/\S+|chat\.whatsapp\.com\/\S+/i;
            if (linkPattern.test(text) && !isSenderAdmin && !isOwner) {
                await sock.sendMessage(from, { delete: m.key });
                await sock.groupParticipantsUpdate(from, [sender], "remove");
                return;
            }
        }

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
                const cmdOptions = { isOwner, isBotAdmin, isSenderAdmin, from, sender, args, text, isGroup };
                
                if (typeof command === 'function') {
                    await command(sock, m, args, cmdOptions);
                } else if (command.execute) {
                    await command.execute(sock, m, args, cmdOptions);
                }
                
                await sock.sendMessage(from, { react: { text: "", key: m.key } });
            } catch (cmdErr) {
                console.error(cmdErr);
                await m.reply(`⛩️ *Erreur Otsutsuki* : ${cmdErr.message}`);
                await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
            }
        }
    } catch (err) {
        console.error("⚠️ Erreur Global Handler :", err);
    }
};
