const config = require('../config');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;

        // 1. SÉCURITÉ MAÎTRE (Priorité absolue via le Handler)
        if (!isOwner) {
            return sock.sendMessage(from, { text: "🏮 Seul un membre du clan supérieur peut utiliser l'Exil." });
        }

        // 2. VÉRIFICATION SI C'EST UN GROUPE
        if (!from.endsWith('@g.us')) {
            return sock.sendMessage(from, { text: "🏮 Cette technique ne peut être utilisée que dans un groupe." });
        }

        // 3. VÉRIFICATION ADMIN BOT
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = participants.find(p => p.id === botId)?.admin;

        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ Erreur : Je dois être admin du groupe pour exiler quelqu'un." });
        }

        // 4. RÉCUPÉRATION DE LA CIBLE (Mention, Réponse ou Argument)
        let users = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                    m.message?.extendedTextMessage?.contextInfo?.participant || 
                    (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!users) {
            return sock.sendMessage(from, { text: "🏮 Mentionnez ou répondez au Shinobi à bannir." });
        }

        // Empêcher le bot de se kick lui-même
        if (users === botId) {
            return sock.sendMessage(from, { text: "🌀 Je ne peux pas m'exiler moi-même de cette dimension." });
        }

        // 5. EXÉCUTION DE L'EXIL
        await sock.groupParticipantsUpdate(from, [users], "remove");
        
        await sock.sendMessage(from, { 
            text: `🌀 *EXIL RÉUSSI* : Le Shinobi @${users.split('@')[0]} a été envoyé dans une autre dimension.`, 
            mentions: [users] 
        });

    } catch (e) {
        console.error("Erreur Kick :", e);
        await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Le chakra est instable. Impossible d'exiler cette cible." });
    }
};
