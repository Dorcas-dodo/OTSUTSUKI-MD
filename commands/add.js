module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;
        // --- FORCE REFRESH ---
        const groupMetadata = await sock.groupMetadata(from);
        const botNumber = sock.user.id.split(':')[0];
        const isBotAdmin = groupMetadata.participants.find(p => p.id.includes(botNumber))?.admin;

        if (!isBotAdmin) return m.reply("❌ Erreur : L'Otsutsuki-MD doit être admin pour inviter.");

        let user = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : 
                   m.message?.extendedTextMessage?.contextInfo?.participant;

        if (!user) return m.reply("👤 Donne le numéro.");

        await sock.groupParticipantsUpdate(from, [user], "add");
        m.reply(`✅ @${user.split('@')[0]} a rejoint le clan.`, { mentions: [user] });

    } catch (e) {
        m.reply("⚠️ Impossible d'ajouter ce Shinobi.");
    }
};
