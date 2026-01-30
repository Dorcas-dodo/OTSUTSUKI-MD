const smsg = require('./Handler/smsg'); // Importation du nouveau nettoyeur
const fs = require('fs');
const path = require('path');
const config = require('./config');

module.exports = async (sock, chatUpdate) => {
    try {
        let m = chatUpdate.messages[0];
        if (!m.message) return;

        // --- ⚡ MODERNISATION DU MESSAGE ---
        // Cette ligne remplace tout ton ancien code de vérification admin
        m = await smsg(sock, m);

        const prefix = config.PREFIXE || ".";
        
        // Reconnaissance Owner (Maître)
        const isOwner = m.fromMe || 
                        m.senderNumber === '242066969267' || 
                        m.senderNumber === '225232933638352' || 
                        m.senderNumber === config.OWNER_NUMBER?.replace(/[^0-9]/g, '');

        // --- 🔓 LOGIQUE DE MODE (SELF/PUBLIC) ---
        // Le bot répond si : c'est l'owner OU si c'est un admin du groupe (même en mode self)
        if (config.MODE === 'self' && !isOwner && !m.isSenderAdmin) return;

        // --- 🎯 TRAITEMENT DES COMMANDES ---
        if (!m.body.startsWith(prefix)) return;

        const args = m.body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            // Réaction visuelle (optionnel)
            await sock.sendMessage(m.chat, { react: { text: "🌀", key: m.key } });

            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            
            try {
                // On envoie 'm' qui contient déjà m.isBotAdmin et m.isSenderAdmin
                await command(sock, m, args, { isOwner });
                
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
