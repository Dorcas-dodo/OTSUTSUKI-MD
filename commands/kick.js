module.exports = async (sock, m, args, { isBotAdmin, isSenderAdmin, isOwner, from }) => {
    // 1. Vérifications de sécurité
    if (!m.isGroup) return m.reply("⛩️ Cette technique ne fonctionne que dans les groupes.");
    if (!isBotAdmin) return m.reply("❌ Erreur : L'Otsutsuki-MD doit être administrateur pour exiler quelqu'un.");
    if (!isSenderAdmin && !isOwner) return m.reply("❌ Seul un haut gradé du clan peut utiliser cette technique.");

    // 2. Récupération de la cible (mention ou réponse)
    let victim = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                 m.message.extendedTextMessage?.contextInfo?.participant;

    if (!victim) return m.reply("🏮 Désigne le Shinobi à exiler en le mentionnant ou en répondant à son message.");

    try {
        await sock.groupParticipantsUpdate(from, [victim], "remove");
        await m.reply("🌀 *EXIL ACCOMPLI !* Le chakra de l'individu a été banni de cette dimension.");
    } catch (err) {
        m.reply("⚠️ Échec de l'exil. L'individu est peut-être trop puissant (Admin).");
    }
};
