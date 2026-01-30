const config = require('../config');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;
        if (!from.endsWith('@g.us')) return;

        // --- 🛡️ VÉRIFICATION DES DROITS (SENDER) ---
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = m.key.participant || m.key.remoteJid;
        
        // Est-ce que celui qui envoie est admin ?
        const isAdmin = participants.find(p => p.id === sender)?.admin;

        // --- 🤖 VÉRIFICATION ADMIN BOT (MÉTHODE ROBUSTE) ---
        const botNumber = sock.user.id.split(':')[0];
        const isBotAdmin = participants.find(p => p.id.includes(botNumber))?.admin;

        // Sécurité : Seul le Maître (isOwner) ou un Admin peut ajouter
        if (!isOwner && !isAdmin) {
            return sock.sendMessage(from, { text: "🏮 Seul un haut gradé du clan peut invoquer de nouveaux Shinobis." });
        }

        // Si le bot n'est pas admin, il ne peut techniquement pas ajouter
        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ Erreur : L'Otsutsuki-MD doit être administrateur pour cette invocation." });
        }

        // --- 🧬 RÉCUPÉRATION DU NUMÉRO ---
        let user = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;
        
        // Si réponse à un message, on prend l'auteur du message
        if (!user && m.message?.extendedTextMessage?.contextInfo?.participant) {
            user = m.message.extendedTextMessage.contextInfo.participant;
        }

        if (!user || user.length < 10) {
            return sock.sendMessage(from, { text: "👤 Précisez le numéro avec l'indicatif pays (ex: .add 242066969267)" });
        }

        // --- ⚡ EXÉCUTION DE L'INVITATION ---
        await sock.groupParticipantsUpdate(from, [user], "add");
        
        await sock.sendMessage(from, { 
            text: `✅ *INVOCATION RÉUSSIE* : @${user.split('@')[0]} a été intégré au clan.`, 
            mentions: [user],
            contextInfo: {
                externalAdReply: {
                    title: "ＯＴＳＵＴＳＵＫＩ ＳＵＭＭＯＮ",
                    body: "Nouveau membre détecté",
                    mediaType: 1,
                    thumbnailUrl: config.URL_RECURS
                }
            }
        });

    } catch (e) {
        console.error("Erreur Add :", e);
        // Souvent l'erreur vient des paramètres de confidentialité de la cible
        await sock.sendMessage(from, { text: "⚠️ Impossible d'ajouter ce Shinobi. Son chakra est peut-être protégé (Paramètres de confidentialité) ou il est déjà dans le groupe." });
    }
};
