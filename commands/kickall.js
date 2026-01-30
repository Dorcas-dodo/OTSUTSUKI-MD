const config = require('../config');

module.exports = async (sock, m, args, { isOwner }) => {
    const from = m.key.remoteJid;
    try {
        if (!from.endsWith('@g.us')) return;

        // --- FORCE REFRESH DES DROITS ---
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const botNumber = sock.user.id.split(':')[0];
        const botInGroup = participants.find(p => p.id.includes(botNumber));
        const isBotAdmin = !!(botInGroup?.admin || botInGroup?.isSuperAdmin);

        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ Le bot doit être admin pour purifier cette dimension." }, { quoted: m });
        }

        if (!isOwner) {
            return sock.sendMessage(from, { text: "🏮 Seul le Maître peut déclencher la Purge." }, { quoted: m });
        }

        // Filtrage (Exclure Admins, Bot et Maîtres)
        const victims = participants.filter(p => !p.admin && !p.id.includes(botNumber));

        if (victims.length === 0) {
            return sock.sendMessage(from, { text: "🏮 Aucun Shinobi de bas rang à purger." }, { quoted: m });
        }

        await sock.sendMessage(from, { text: `🔥 *PURGE DES SIX CHEMINS* 🔥\n\nÉlimination de ${victims.length} membres...` }, { quoted: m });

        for (let v of victims) {
            await sock.groupParticipantsUpdate(from, [v.id], "remove");
            await new Promise(res => setTimeout(res, 1000)); // Délai anti-ban
        }

        await sock.sendMessage(from, { text: "✅ *DIMENSION PURIFIÉE.*" }, { quoted: m });

    } catch (e) {
        console.error("Erreur Kickall :", e);
        await sock.sendMessage(from, { text: "⚠️ Le chakra est instable." }, { quoted: m });
    }
};
