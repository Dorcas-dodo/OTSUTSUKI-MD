module.exports = async (sock, m, args, { isOwner }) => {
    // 1. Vérifications de sécurité (Utilisation des propriétés injectées dans 'm')
    if (!m.isGroup) return m.reply("⛩️ Cette technique ne fonctionne que dans les groupes.");
    
    // On vérifie les droits directement sur m
    if (!m.isBotAdmin) return m.reply("❌ Erreur : L'Otsutsuki-MD doit être administrateur pour exiler quelqu'un.");
    if (!m.isSenderAdmin && !isOwner) return m.reply("❌ Seul un haut gradé du clan peut utiliser cette technique.");

    // 2. Récupération de la cible (mention ou réponse)
    // Grâce à smsg.js, m.quoted est simplifié
    let victim = m.quoted ? m.quoted.sender : m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    if (!victim) return m.reply("🏮 Désigne le Shinobi à exiler en le mentionnant ou en répondant à son message.");

    // Empêcher le bot de s'auto-kick ou de kick l'owner
    if (victim.includes(sock.user.id.split(':')[0])) return m.reply("🌀 Ma puissance est trop grande pour être bannie par ma propre technique.");

    try {
        await sock.groupParticipantsUpdate(m.chat, [victim], "remove");
        await m.reply("🌀 *EXIL ACCOMPLI !* Le chakra de l'individu a été banni de cette dimension.");
    } catch (err) {
        console.error(err);
        m.reply("⚠️ Échec de l'exil. L'individu est peut-être protégé par un sceau (Admin).");
    }
};
