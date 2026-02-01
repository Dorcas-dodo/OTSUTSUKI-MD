const smsg = require('./Handler/smsg');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { deepseekCommand } = require('./gemini'); // - Importation de l'IA

module.exports = async (sock, chatUpdate) => {
    try {
        let m = chatUpdate.messages[0];
        if (!m.message) return;

        // --- ⚡ MODERNISATION DU MESSAGE ---
        m = await smsg(sock, m);

        const prefix = config.PREFIXE || ".";
        const isOwner = m.fromMe || 
                        m.senderNumber === '242066969267' || 
                        m.senderNumber === '225232933638352' || 
                        m.senderNumber === config.OWNER_NUMBER?.replace(/[^0-9]/g, '');

        // --- 👁️ AUTO-READ STATUS ---
        if (m.key.remoteJid === 'status@broadcast' && config.AUTO_READ_STATUS) {
            await sock.readMessages([m.key]);
            console.log(`🌀 Statut vu de : ${m.pushName || m.senderNumber}`);
        }

        // --- 🛡️ SYSTÈME ANTI-LINK ---
        if (m.isGroup && config.ANTILINK && !isOwner && !m.isSenderAdmin) {
            const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
            if (linkRegex.test(m.body)) {
                await sock.sendMessage(m.chat, { delete: m.key });
                if (m.isBotAdmin) {
                    await sock.groupParticipantsUpdate(m.chat, [m.sender], "remove");
                    await m.reply("🚫 *Lien interdit !* Le contrevenant a été banni par le sceau Otsutsuki.");
                } else {
                    await m.reply("⚠️ *Lien détecté !* Je ne suis pas admin pour bannir l'intrus.");
                }
                return;
            }
        }

        // --- 🔓 LOGIQUE DE MODE (PUBLIC/PRIVATE/SELF) ---
        if ((config.MODE === 'self' || config.MODE === 'private') && !isOwner) return;

        // --- 🎯 TRAITEMENT DES COMMANDES ---
        if (!m.body.startsWith(prefix)) return;

        const args = m.body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const query = args.join(" "); // Texte pour l'IA

        // --- 🤖 INTÉGRATION SPÉCIALE : IA DEEPSEEK ---
        if (cmdName === "ai" || cmdName === "deepseek") {
            if (!query) return m.reply(`⛩️ Pose-moi une question shinobi !\nExemple : *${prefix}ai qui est Indra Otsutsuki ?*`);
            
            // Appelle la fonction de gemini.js
            return await deepseekCommand(sock, m.chat, m, query); 
        }

        // --- 📂 GESTION DES COMMANDES PAR FICHIERS (.js) ---
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            // Réaction "Processing"
            await sock.sendMessage(m.chat, { react: { text: "🌀", key: m.key } });

            if (config.AUTO_TYPING) {
                await sock.sendPresenceUpdate('composing', m.chat);
            }

            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            
            try {
                await command(sock, m, args, { isOwner, prefix, config });
                await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
            } catch (cmdErr) {
                console.error(cmdErr);
                await m.reply(`⛩️ *Erreur Otsutsuki* : ${cmdErr.message}`);
            }
        }
    } catch (err) {
        console.error("⚠️ Erreur Handler :", err);
    }
};
