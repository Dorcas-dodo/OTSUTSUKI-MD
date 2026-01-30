const fs = require('fs');
const path = require('path');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;

        // 1. SÉCURITÉ MAÎTRE UNIQUE
        if (!isOwner) {
            return sock.sendMessage(from, { text: "🏮 Seul le Grand Maître peut sceller l'accès au bot." });
        }

        // 2. IDENTIFIER LA CIBLE
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                     m.message?.extendedTextMessage?.contextInfo?.participant ||
                     (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!target) {
            return sock.sendMessage(from, { text: "⚠️ Mentionnez ou répondez au Shinobi dont vous voulez sceller les pouvoirs." });
        }

        // Protection : Ne pas se bannir soi-même ou le bot
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (target === botId || target.includes('242066969267')) {
            return sock.sendMessage(from, { text: "❌ Impossible de sceller un membre de la lignée originelle." });
        }

        // 3. GESTION DE LA BASE DE DONNÉES (JSON)
        const dirPath = './data';
        const filePath = path.join(dirPath, 'banned.json');

        // Créer le dossier data s'il n'existe pas
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }

        let banned = [];
        if (fs.existsSync(filePath)) {
            banned = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }

        // 4. EXÉCUTION DU BANNISSEMENT
        if (!banned.includes(target)) {
            banned.push(target);
            fs.writeFileSync(filePath, JSON.stringify(banned, null, 2));

            const banMsg = `╔════════════════════╗
   🚫  *SCEAU DE BANNISSEMENT*
╚════════════════════╝

🏮 *sʜɪɴᴏʙɪ :* @${target.split('@')[0]}
📜 *sᴛᴀᴛᴜs :* ᴘᴏᴜᴠᴏɪʀs sᴄᴇʟʟés
⚖️ *ᴅéᴄɪsɪᴏɴ :* ɪɴᴛᴇʀᴅɪᴛ ᴅ'ᴜᴛɪʟɪsᴇʀ ʟᴇ ʙᴏᴛ

🌑 _"Ton chakra est désormais invisible pour l'Otsutsuki-MD."_`;

            await sock.sendMessage(from, { 
                text: banMsg, 
                mentions: [target] 
            });
        } else {
            await sock.sendMessage(from, { text: "ℹ️ Ce Shinobi a déjà son chakra scellé." });
        }

    } catch (e) {
        console.error("Erreur Ban :", e);
        await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Échec de l'application du sceau." });
    }
};
