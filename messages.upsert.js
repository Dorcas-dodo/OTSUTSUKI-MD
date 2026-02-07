const smsg = require('./Handler/smsg');
const fs = require('fs');
const path = require('path');
const config = require('./config');
// ✅ Importation de l'IA
const { deepseekCommand } = require('./commands/gemini'); 

module.exports = async (sock, chatUpdate) => {
    try {
        let m = chatUpdate.messages[0];
        if (!m.message) return;

        // --- ⚡ MODERNISATION DU MESSAGE ---
        m = await smsg(sock, m);

        // Ignorer les messages du bot lui-même pour éviter les boucles infinies
        if (m.key.fromMe) return;

        const prefix = config.PREFIXE || ".";
        
        // --- 👥 GESTION DES DROITS (ADMINS / OWNER) ---
        let groupMetadata = m.isGroup ? await sock.groupMetadata(m.chat).catch(() => null) : null;
        const participants = groupMetadata ? groupMetadata.participants : [];
        const groupAdmins = participants.filter(v => v.admin !== null).map(v => v.id);

        // Nettoyage dynamique du numéro owner
        const ownerConfig = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : '';

        const isOwner = m.senderNumber === ownerConfig || 
                        m.senderNumber === '242068079834' || 
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
        // Si le mode est 'self' ou 'private', seul l'owner peut utiliser le bot.
        // Si le mode est 'public', tout le monde peut l'utiliser.
        if ((config.MODE === 'self' || config.MODE === 'private') && !isOwner) return;

        // --- 🎯 TRAITEMENT DES COMMANDES ---
        // On vérifie si le message commence par le préfixe
        const isCmd = m.body.startsWith(prefix);
        if (!isCmd) return;

        const args = m.body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const query = args.join(" ");

        // --- 🤖 IA DEEPSEEK / AI ---
        if (cmdName === "ai" || cmdName === "deepseek") {
            if (!query) return m.reply(`⛩️ Pose-moi une question !`);
            // Réaction pour montrer que l'IA réfléchit
            await sock.sendMessage(m.chat, { react: { text: "🧠", key: m.key } });
            return await deepseekCommand(sock, m.chat, m, query); 
        }

        // --- 📂 GESTION DES COMMANDES PAR FICHIERS ---
        // On cherche le fichier dans ./commands/nom_de_la_commande.js
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            // Effet visuel : Le bot "écrit" et réagit
            await sock.sendMessage(m.chat, { react: { text: "🌀", key: m.key } });
            if (config.AUTO_TYPING) {
                await sock.sendPresenceUpdate('composing', m.chat);
            }

            // Rechargement du cache pour permettre les modifs en temps réel sans redémarrer
            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            
            try {
                // Exécution de la commande avec passage des variables utiles
                await command(sock, m, args, { 
                    isOwner, 
                    isAdmins, 
                    isBotAdmin, 
                    prefix, 
                    config, 
                    groupMetadata, 
                    participants,
                    query
                });
                
                // Signal de réussite
                await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
            } catch (cmdErr) {
                console.error(cmdErr);
                await m.reply(`⛩️ *Erreur Otsutsuki* : ${cmdErr.message}`);
            }
        }
    } catch (err) {
        console.error("⚠️ Erreur Global Handler :", err);
    }
};
