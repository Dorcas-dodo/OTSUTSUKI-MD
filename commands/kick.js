const isAdmin = require('../lib/isAdmin');

module.exports = {
    name: "kick",
    async execute(sock, from, msg, args, config) {
        if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: "❌ Cette commande est réservée aux groupes." });

        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, from, msg.key.participant || msg.key.remoteJid);

        if (!isBotAdmin) return sock.sendMessage(from, { text: "⚠️ Le bot doit être *admin* pour expulser quelqu'un." });
        if (!isSenderAdmin) return sock.sendMessage(from, { text: "❌ Seuls les admins peuvent utiliser cette commande." });

        let usersToKick = [];
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            usersToKick = msg.message.extendedTextMessage.contextInfo.mentionedJid;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            usersToKick = [msg.message.extendedTextMessage.contextInfo.participant];
        }

        if (usersToKick.length === 0) return sock.sendMessage(from, { text: "⚠️ Mentionne la personne ou réponds à son message pour l'expulser." });

        for (let user of usersToKick) {
            await sock.groupParticipantsUpdate(from, [user], "remove");
        }
        await sock.sendMessage(from, { text: "✅ Utilisateur(s) expulsé(s) par *OTSUTSUKI-MD*." });
    }
};