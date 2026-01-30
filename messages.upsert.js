const fs = require('fs');
const path = require('path');
const isAdminFunc = require('./lib/isAdmin'); // Vérifie que le fichier est bien dans /lib/

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
            try {
                extraOwners = JSON.parse(fs.readFileSync(ownersPath, 'utf-8'));
            } catch (e) { extraOwners = []; }
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
            try {
                const check = await isAdminFunc(sock, from, sender);
                isBotAdmin = check.isBotAdmin;
                isSenderAdmin = check.isSenderAdmin;
                
                // LOG DE DEBUG UNIQUE (Apparaîtra à chaque message en groupe)
                console.log(`🛡️ [GROUPE] BotAdmin: ${isBotAdmin} | SenderAdmin: ${isSenderAdmin} | User: ${cleanSender}`);
            } catch (adminErr) {
                console.error("❌ Erreur isAdminFunc :", adminErr);
            }
        }

        // --- 🚫 VÉRIFICATION DU BANNISSEMENT ---
        const bannedPath = './data/banned.json';
        if (fs.existsSync(bannedPath) && !isOwner) {
            try {
                const bannedList = JSON.parse(fs.readFileSync(bannedPath, 'utf-8'));
                if (bannedList.includes(sender)) return;
            } catch (e) {}
        }

        // --- 1. SYSTÈME ANTILINK ---
        if (isGroup && config.ANTILINK === "true") {
            const linkPattern = /https?:\/\/\S+|chat\.whatsapp\.com\/\S+/i;
            if (linkPattern.test(text) && !isSenderAdmin && !isOwner) {
                if (isBotAdmin) {
                    await sock.sendMessage(from, { delete: m.key });
                    await sock.groupParticipantsUpdate(from, [sender], "remove");
                    return;
                } else {
                    console.log("⚠️ Antilink détecté mais le bot n'est PAS admin.");
                }
            }
        }

        if (config.MODE === 'self' && !isOwner) return;

        // --- 3. TRAITEMENT DES COMMANDES ---
        const prefix = config.PREFIXE || ".";
        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        
        // On cherche la commande dans le dossier 'commands'
        const commandPath = path.join(__dirname, 'commands', `${cmdName}.js`);

        if (fs.existsSync(commandPath)) {
            // Petit clin d'œil visuel
            await sock.sendMessage(from, { react: { text: "🌀", key: m.key } });
            
            // Rechargement à chaud (Hot Reload)
            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            
            try {
                // IMPORTANT : On transmet les variables de droits à la commande
                const cmdOptions = { 
                    isOwner, 
                    isBotAdmin, 
                    isSenderAdmin, 
                    from, 
                    sender, 
                    args, 
                    text,
                    isGroup
                };
                
                if (typeof command === 'function') {
                    await command(sock, m, args, cmdOptions);
                } else if (command.execute) {
                    await command.execute(sock, m, args, cmdOptions);
                }
                
                // Retrait de la réaction après succès
                await sock.sendMessage(from, { react: { text: "", key: m.key } });
            } catch (cmdErr) {
                console.error(`❌ Erreur dans la commande ${cmdName}:`, cmdErr);
                await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                await sock.sendMessage(from, { text: `⛩️ *Erreur Otsutsuki* : ${cmdErr.message}` }, { quoted: m });
            }
        }
    } catch (err) {
        console.error("⚠️ Erreur Handler Global :", err);
    }
};
