const config = require('../config');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const cleanSender = sender.split('@')[0];
        const cleanOwner = config.NUMERO_OWNER ? config.NUMERO_OWNER.replace(/[^0-9]/g, '') : '';

        // SÉCURITÉ MAÎTRE
        const isOwner = m.key.fromMe || cleanSender === cleanOwner || cleanSender === '242066969267';
        if (!isOwner) return sock.sendMessage(from, { text: "🏮 Seul un membre du clan supérieur peut utiliser l'Exil." });

        // VÉRIFICATION ADMIN BOT
        const groupMetadata = m.isGroup ? await sock.groupMetadata(from) : null;
        const participants = m.isGroup ? groupMetadata.participants : [];
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = participants.find(p => p.id === botId)?.admin;

        if (!isBotAdmin) return sock.sendMessage(from, { text: "❌ Erreur : Je dois être admin du groupe pour exiler quelqu'un." });

        // CIBLE
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.message.extendedTextMessage?.contextInfo?.quotedMessage ? m.message.extendedTextMessage.contextInfo.participant : null;
        if (!users) return sock.sendMessage(from, { text: "🏮 Mentionnez ou répondez au Shinobi à bannir." });

        await sock.groupParticipantsUpdate(from, [users], "remove");
        await sock.sendMessage(from, { text: `🌀 *EXIL RÉUSSI* : Le Shinobi @${users.split('@')[0]} a été envoyé dans une autre dimension.`, mentions: [users] });

    } catch (e) {
        console.error(e);
    }
};
