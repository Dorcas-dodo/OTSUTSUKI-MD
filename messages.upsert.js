const fs = require('fs');
const path = require('path');
const isAdminFunc = require('./lib/isAdmin'); // Assure-toi que le chemin est correct

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

        // --- 🔎 RECONNAISSANCE MAÎTRE DYNAMIQUE ---
        const cleanSender = sender.split('@')[0].replace(/[^0-9]/g, '');
        const ownersPath = './data/owners.json';
        let extraOwners = [];
        if (fs.existsSync(ownersPath)) {
            extraOwners = JSON.parse(fs.readFileSync(ownersPath, 'utf-8'));
        }

        const master1 = '242066969267';
        const master2 = '225232933638352'; 
        const cleanOwner = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : master1;
        
        const isOwner = m.key.fromMe || 
                        cleanSender === master1 || 
                        cleanSender === master2 || 
                        cleanSender === cleanOwner ||
                        extraOwners.includes(cleanSender);

        // --- 🛡️ VÉRIFICATION DES DROITS (ADMINS) ---
        let isBotAdmin = false;
        let isSenderAdmin = false;

        if (isGroup) {
            const check = await isAdminFunc(sock, from, sender);
            isBotAdmin = check.isBotAdmin;
            isSenderAdmin = check.isSenderAdmin;
        }

        // --- 🚫 VÉRIFICATION DU BANNISSEMENT ---
        const bannedPath = './data/banned.json';
        if (fs.existsSync(bannedPath) && !isOwner) {
            const bannedList = JSON.parse(fs.readFileSync(bannedPath, 'utf-8'));
            if (bannedList.includes(sender)) return;
        }

        // --- 1. SYSTÈME ANTILINK (UTILISE LES NOUVELLES VARIABLES) ---
        if (isGroup && config.ANTILINK === "true") {
            const linkPattern = /https?:\/\/\S+|chat\.whatsapp\.com\/\S+/i;
            if (linkPattern.test(text) && !isSenderAdmin && !isOwner) {
                if (isBotAdmin) {
                    await sock.sendMessage(from, { delete: m.key });
                    await sock.groupParticipantsUpdate(from, [sender], "remove");
                    return;
                }
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
                // On passe isBotAdmin et isSenderAdmin à la commande !
                const cmdOptions = { isOwner, isBotAdmin, isSenderAdmin };
                
                if (typeof command === 'function') {
                    await command(sock, m, args, cmdOptions);
                } else if (command.execute) {
                    await command.execute(sock, m, args, cmdOptions);
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
