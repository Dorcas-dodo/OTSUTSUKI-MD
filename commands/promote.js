module.exports = async (sock, m, args, { isBotAdmin, isSenderAdmin, isOwner, from }) => {
    if (!isBotAdmin) return m.reply("❌ Je n'ai pas les droits d'administrateur.");
    if (!isSenderAdmin && !isOwner) return m.reply("❌ Accès refusé.");

    let target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                 m.message.extendedTextMessage?.contextInfo?.participant;

    if (!target) return m.reply("🏮 Mentionne le futur administrateur.");

    await sock.groupParticipantsUpdate(from, [target], "promote");
    m.reply("✨ *ÉLÉVATION !* Un nouveau membre a rejoint le cercle des administrateurs.");
};
