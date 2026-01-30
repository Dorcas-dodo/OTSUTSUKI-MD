module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;
        if (!from.endsWith('@g.us')) return m.reply("🏮 Uniquement en groupe.");

        // --- FORCE REFRESH DES DROITS ---
        const groupMetadata = await sock.groupMetadata(from);
        const botNumber = sock.user.id.split(':')[0];
        const isBotAdmin = groupMetadata.participants.find(p => p.id.includes(botNumber))?.admin;

        if (!isBotAdmin) return m.reply("❌ Erreur : Je dois être admin pour exiler quelqu'un.");
        if (!isOwner) return m.reply("🏮 Seul le Maître peut utiliser l'Exil.");

        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                     m.message?.extendedTextMessage?.contextInfo?.participant || 
                     (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!target) return m.reply("🏮 Mentionne la cible.");

        await sock.groupParticipantsUpdate(from, [target], "remove");
        m.reply(`🌀 @${target.split('@')[0]} a été exilé.`, { mentions: [target] });

    } catch (e) {
        m.reply("⚠️ Erreur : Le chakra est instable.");
    }
};
