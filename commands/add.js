const config = require('../config');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;
        if (!from.endsWith('@g.us')) return;

        // --- 🛡️ VÉRIFICATION DES DROITS ---
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = m.key.participant || m.key.remoteJid;
        
        const isAdmin = participants.find(p => p.id === sender)?.admin;
        const botNumber = sock.user.id.split(':')[0];
        const isBotAdmin = participants.find(p => p.id.includes(botNumber))?.admin;

        if (!isOwner && !isAdmin) {
            return sock.sendMessage(from, { text: "🏮 Seul un haut gradé du clan peut invoquer de nouveaux Shinobis." });
        }

        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ Erreur : L'Otsutsuki-MD doit être administrateur pour cette invocation." });
        }

        // --- 🧬 RÉCUPÉRATION DU NUMÉRO ---
        let user = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;
        
        if (!user && m.message?.extendedTextMessage?.contextInfo?.participant) {
            user = m.message.extendedTextMessage.contextInfo.participant;
        }

        if (!user || user.length < 10) {
            return sock.sendMessage(from, { text: "👤 Précisez le numéro avec l'indicatif pays (ex: .add 242066969267)" });
        }

        // --- ⚡ EXÉCUTION DE L'INVITATION ---
        const response = await sock.groupParticipantsUpdate(from, [user], "add");

        // Baileys renvoie un statut pour chaque ajout (200 = succès, 403 = privé, 409 = déjà là)
        if (response[0].status === "403") {
            return sock.sendMessage(from, { text: "⚠️ Le chakra de ce Shinobi est protégé (Confidentialité). Je ne peux pas l'ajouter manuellement." });
        } else if (response[0].status === "409") {
            return sock.sendMessage(from, { text: "🏮 Ce membre fait déjà partie du clan." });
        }
        
        await sock.sendMessage(from, { 
            text: `✅ *INVOCATION RÉUSSIE* : @${user.split('@')[0]} a été intégré au clan.`, 
            mentions: [user],
            contextInfo: {
                externalAdReply: {
                    title: "ＯＴＳＵＴＳＵＫＩ ＳＵＭＭＯＮ",
                    body: "Nouveau membre détecté",
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnailUrl: config.MENU_IMG || config.URL_RECURS,
                    sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                }
            }
        });

    } catch (e) {
        console.error("Erreur Add :", e);
        await sock.sendMessage(from, { text: "⚠️ Le flux de chakra a échoué. Vérifiez le numéro ou les droits du bot." });
    }
};
