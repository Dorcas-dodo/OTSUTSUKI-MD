const config = require('../config');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        // 1. VÉRIFICATION GROUPE
        if (!isGroup) return sock.sendMessage(from, { text: "Cette commande ne peut être utilisée que dans un clan (groupe). ❌" });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = m.key.participant || m.key.remoteJid;
        
        // VÉRIFICATION DES DROITS
        const isAdmin = participants.find(p => p.id === sender)?.admin;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = participants.find(p => p.id === botId)?.admin;

        // PRIORITÉ AU MAÎTRE : Si ce n'est pas l'owner et pas un admin, on refuse.
        if (!isOwner && !isAdmin) {
            return sock.sendMessage(from, { text: "🏮 Seuls les hauts gradés du clan peuvent nommer de nouveaux chefs." });
        }

        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "Le bot doit être administrateur pour modifier les rangs. ❌" });
        }

        // 2. IDENTIFIER LA CIBLE (Mention, Réponse ou Argument)
        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                     m.message?.extendedTextMessage?.contextInfo?.participant ||
                     (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!target) {
            return sock.sendMessage(from, { text: "👤 Veuillez mentionner le Shinobi à promouvoir ou répondre à son message." });
        }

        // 3. EXÉCUTION DE LA PROMOTION
        await sock.groupParticipantsUpdate(from, [target], "promote");

        const successMsg = `╔════════════════════╗
   ⛩️  *PROMOTION DU CLAN* ⛩️
╚════════════════════╝

🏮 *SHINOBI :* @${target.split('@')[0]}
🌀 *RANG :* ᴀᴅᴍɪɴɪsᴛʀᴀᴛᴇᴜʀ
📜 *sᴛᴀᴛᴜs :* ᴀᴜᴛᴏʀɪᴛé ᴄᴏɴғɪʀᴍéᴇ

🌊 _"Un nouveau chef s'élève. Que sa sagesse guide le clan vers la puissance."_

*© ᴏᴛsᴜᴛsᴜᴋɪ ʟᴇɢᴀᴄʏ*`;

        await sock.sendMessage(from, { 
            text: successMsg, 
            mentions: [target],
            contextInfo: {
                externalAdReply: {
                    title: "ＯＴＳＵＴＳＵＫＩ ＲＡＮＫ",
                    body: "Élévation de rang confirmée",
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    thumbnailUrl: config.MENU_IMG
                }
            }
        });

    } catch (err) {
        console.error("Erreur Promote :", err);
        await sock.sendMessage(from, { text: "Échec de la promotion. Chakra insuffisant. ❌" });
    }
};
