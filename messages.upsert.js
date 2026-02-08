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

        // --- 🛠️ CORRECTION : GESTION DU SELF-REPLY ---
        // On n'arrête le script que si le message vient du bot ET que SELF_REPLY est désactivé
        if (m.key.fromMe && config.SELF_REPLY !== "true") {
            // Si vous voulez que le bot réponde à vos propres commandes, 
            // on ne doit pas mettre de "return" ici tant que c'est une commande valide.
        }

        // 🟢 DIAGNOSTIC : On affiche chaque message reçu dans les logs Koyeb
        console.log(`📩 [${m.senderNumber}] : ${m.body || '[Média/Image]'}`);

        const prefix = config.PREFIXE || ".";
        const body = m.body || ""; 

        // --- 👥 GESTION DES DROITS ---
        let groupMetadata = m.isGroup ? await sock.groupMetadata(m.chat).catch(() => null) : null;
        const participants = groupMetadata ? groupMetadata.participants : [];
        const groupAdmins = participants.filter(v => v.admin !== null).map(v => v.id);

        const ownerConfig = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : '';
        
        // Ajout de m.key.fromMe pour s'assurer que vous êtes toujours reconnu comme Owner
        const isOwner = [ownerConfig, '242068079834', '242066969267'].includes(m.senderNumber) || m.key.fromMe;
        
        const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;
        const isBotAdmin = m.isGroup ? groupAdmins.includes(sock.user.id.split(':')[0] + '@s.whatsapp.net') : false;

        // --- 👁️ AUTO-READ STATUS ---
        if (m.key.remoteJid === 'status@broadcast' && config.AUTO_READ_STATUS) {
            await sock.readMessages([m.key]);
        }

        // --- 🔓 LOGIQUE DE MODE ---
        // Autorise l'Owner même si le mode est "self" ou "private"
        if ((config.MODE === 'self' || config.MODE === 'private') && !isOwner) return;

        // --- 🎯 TRAITEMENT DES COMMANDES ---
        const isCmd = body.startsWith(prefix);
        if (!isCmd) return;

        // Si c'est une commande mais que ça vient de "moi" (le bot), 
        // on vérifie quand même si on a le droit de répondre à soi-même
        if (m.key.fromMe && config.SELF_REPLY !== "true" && isCmd) {
            // On laisse passer pour que l'owner puisse tester ses commandes
        } else if (m.key.fromMe && config.SELF_REPLY !== "true") {
            return; // Bloque les messages normaux du bot pour éviter les boucles
        }

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
