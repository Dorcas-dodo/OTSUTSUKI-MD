const smsg = require('./Handler/smsg');
const fs = require('fs');
const path = require('path');
const config = require('./config');
// ✅ Modification du chemin : On va chercher gemini dans le dossier commands
const { deepseekCommand } = require('./commands/gemini'); 

module.exports = async (sock, chatUpdate) => {
    try {
        let m = chatUpdate.messages[0];
        if (!m.message) return;

        // --- ⚡ MODERNISATION DU MESSAGE ---
        m = await smsg(sock, m);

        const prefix = config.PREFIXE || ".";
        
        // --- 👥 GESTION DES DROITS (ADMINS / OWNER) ---
        const groupMetadata = m.isGroup ? await sock.groupMetadata(m.chat) : '';
        const participants = m.isGroup ? groupMetadata.participants : [];
        const groupAdmins = participants.filter(v => v.admin !== null).map(v => v.id);

        // Nettoyage dynamique du numéro owner configuré sur Koyeb
        const ownerConfig = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : '';

        const isOwner = m.fromMe || 
                        m.senderNumber === ownerConfig || 
                        m.senderNumber === '242068079834' || // Ton numéro Master
                        m.senderNumber === '242066969267'; 
        
        const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;
        const isBotAdmin = m.isGroup ? groupAdmins.includes(sock.user.id.split(':')[0] + '@s.whatsapp.net') : false;

        // --- 👁️ AUTO-READ STATUS ---
        if (m.key.remoteJid === 'status@broadcast' && config.AUTO_READ_STATUS) {
            await sock.readMessages([m.key]);
        }

        // --- 🛡️ SYSTÈME ANTI-LINK ---
        if (m.isGroup && config.ANTILINK && !isOwner && !isAdmins) {
            const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
            if (linkRegex.test(m.body)) {
                if (isBotAdmin) {
                    await sock.sendMessage(m.chat, { delete: m.key });
                    await sock.groupParticipantsUpdate(m.chat, [m.sender], "remove");
                    return await m.reply("🚫 *Lien interdit !* Bannissement par le sceau Otsutsuki.");
                }
            }
        }

        // --- 🔓 LOGIQUE DE MODE SÉCURISÉE ---
        // En mode SELF ou PRIVATE, le bot n'écoute QUE l'owner (isOwner).
        // Grâce à la modif plus haut, isOwner fonctionne maintenant dans les groupes pour TOI.
        if ((config.MODE === 'self' || config.MODE === 'private') && !isOwner) return;

        // --- 🎯 TRAITEMENT DES COMMANDES ---
        if (!m.body.startsWith(prefix)) return;

        const args = m.body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const query = args.join(" ");

        // --- 🤖 IA DEEPSEEK ---
        if (cmdName === "ai" || cmdName === "deepseek") {
            if (!query) return m.reply(`⛩️ Pose-moi une question !`);
            return await deepseekCommand(sock, m.chat, m, query); 
        }

        // --- 📂 GESTION DES COMMANDES PAR FICHIERS ---
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            // Réaction Processing
            await sock.sendMessage(m.chat, { react: { text: "🌀", key: m.key } });

            if (config.AUTO_TYPING) {
                await sock.sendPresenceUpdate('composing', m.chat);
            }

            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            
            try {
                // On passe 'isAdmins' et 'isBotAdmin' à la commande
                await command(sock, m, args, { isOwner, isAdmins, isBotAdmin, prefix, config });
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
