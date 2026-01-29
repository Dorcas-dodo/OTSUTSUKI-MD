const config = require('../config');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        // 1. Vérification groupe
        if (!from.endsWith('@g.us')) {
            return sock.sendMessage(from, { text: "🏮 Cette technique est interdite hors d'un groupe." });
        }

        // 2. Récupération des données du groupe (Admin Check)
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        const isBotAdmin = participants.find(p => p.id === botId)?.admin;
        const isSenderAdmin = participants.find(p => p.id === sender)?.admin;
        const isOwner = sender.includes(config.OWNER_NUMBER) || m.key.fromMe;

        if (!isBotAdmin) return sock.sendMessage(from, { text: "⚠️ Le bot doit être *ADMIN* pour bannir." });
        if (!isSenderAdmin && !isOwner) return sock.sendMessage(from, { text: "🚷 Seul un admin du clan peut utiliser cette commande." });

        // 3. Identification de la cible (Tag, Reply ou Argument)
        let usersToKick = [];
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;

        if (mentioned && mentioned.length > 0) {
            usersToKick = mentioned;
        } else if (quoted) {
            usersToKick = [quoted];
        } else if (args[0]) {
            usersToKick = [args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'];
        }

        if (usersToKick.length === 0) {
            return sock.sendMessage(from, { text: "🏮 Tag un shinobi ou réponds à son message pour l'expulser." });
        }

        // 4. Exécution du Kick
        for (let user of usersToKick) {
            // Empêcher de kick le bot lui-même ou l'owner
            if (user === botId || user.includes(config.OWNER_NUMBER)) continue;

            await sock.groupParticipantsUpdate(from, [user], "remove");
        }

        await sock.sendMessage(from, { 
            text: `🚷 *DÉPLOIEMENT TERMINÉ*\n\nLe(s) fautif(s) ont été bannis du clan par l'autorité *OTSUTSUKI-MD*.` 
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Erreur lors de l'expulsion." });
    }
};
