const smsg = require('./Handler/smsg');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { deepseekCommand } = require('./commands/gemini'); 

module.exports = async (sock, chatUpdate) => {
    try {
        let m = chatUpdate.messages[0];
        if (!m.message) return;

        // --- ⚡ MODERNISATION DU MESSAGE ---
        m = await smsg(sock, m);

        // Ignorer les messages du bot lui-même
        if (m.key.fromMe) return;

        // 🟢 DIAGNOSTIC : On affiche chaque message reçu dans les logs Koyeb
        console.log(`📩 [${m.senderNumber}] : ${m.body || '[Média/Image]'}`);

        const prefix = config.PREFIXE || ".";
        const body = m.body || ""; // Sécurité : évite les erreurs si le body est vide

        // --- 👥 GESTION DES DROITS ---
        let groupMetadata = m.isGroup ? await sock.groupMetadata(m.chat).catch(() => null) : null;
        const participants = groupMetadata ? groupMetadata.participants : [];
        const groupAdmins = participants.filter(v => v.admin !== null).map(v => v.id);

        const ownerConfig = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : '';
        const isOwner = [ownerConfig, '242068079834', '242066969267'].includes(m.senderNumber);
        
        const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;
        const isBotAdmin = m.isGroup ? groupAdmins.includes(sock.user.id.split(':')[0] + '@s.whatsapp.net') : false;

        // --- 👁️ AUTO-READ STATUS ---
        if (m.key.remoteJid === 'status@broadcast' && config.AUTO_READ_STATUS) {
            await sock.readMessages([m.key]);
        }

        // --- 🔓 LOGIQUE DE MODE ---
        if ((config.MODE === 'self' || config.MODE === 'private') && !isOwner) return;

        // --- 🎯 TRAITEMENT DES COMMANDES ---
        const isCmd = body.startsWith(prefix);
        if (!isCmd) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const query = args.join(" ");

        // --- 🤖 IA DEEPSEEK / AI ---
        if (cmdName === "ai" || cmdName === "deepseek") {
            if (!query) return m.reply(`⛩️ Pose-moi une question !`);
            await sock.sendMessage(m.chat, { react: { text: "🧠", key: m.key } });
            return await deepseekCommand(sock, m.chat, m, query); 
        }

        // --- 📂 GESTION DES COMMANDES PAR FICHIERS ---
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            // Effet visuel
            await sock.sendMessage(m.chat, { react: { text: "🌀", key: m.key } });
            
            if (config.AUTO_TYPING) {
                await sock.sendPresenceUpdate('composing', m.chat);
            }

            // Nettoyage du cache pour les mises à jour en direct
            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            
            try {
                await command(sock, m, args, { 
                    isOwner, isAdmins, isBotAdmin, prefix, config, groupMetadata, participants, query 
                });
                await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
            } catch (cmdErr) {
                console.error("❌ Erreur Commande :", cmdErr);
                await m.reply(`⛩️ *Erreur Otsutsuki* : ${cmdErr.message}`);
            }
        } else {
            console.log(`❓ Commande inconnue : ${cmdName}`);
        }
    } catch (err) {
        console.error("⚠️ Erreur Global Handler :", err);
    }
};
