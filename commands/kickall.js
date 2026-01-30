module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;
        // --- FORCE REFRESH ---
        const groupMetadata = await sock.groupMetadata(from);
        const botNumber = sock.user.id.split(':')[0];
        const isBotAdmin = groupMetadata.participants.find(p => p.id.includes(botNumber))?.admin;

        if (!isBotAdmin) return m.reply("❌ Le bot doit être admin pour la purge.");
        if (!isOwner) return m.reply("🏮 Seul le Maître peut purger.");

        const victims = groupMetadata.participants.filter(p => !p.admin && !p.id.includes(botNumber));

        for (let v of victims) {
            await sock.groupParticipantsUpdate(from, [v.id], "remove");
            await new Promise(res => setTimeout(res, 1000)); // Sécurité
        }
        m.reply("✅ Dimension purifiée.");

    } catch (e) {
        m.reply("⚠️ Purge interrompue.");
    }
};
