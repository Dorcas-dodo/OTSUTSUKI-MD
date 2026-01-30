module.exports = async (sock, m, args, { isOwner }) => {
    const from = m.key.remoteJid;
    if (!from.endsWith('@g.us')) return;

    // --- 🛡️ VÉRIFICATION DES DROITS ---
    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;
    const sender = m.key.participant || m.key.remoteJid;
    const isAdmin = participants.find(p => p.id === sender)?.admin;

    // Si tu n'es ni l'Owner ni un Admin, on bloque
    if (!isOwner && !isAdmin) {
        return sock.sendMessage(from, { text: "🏮 Seul un haut gradé peut inviter des Shinobis." });
    }

    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = participants.find(p => p.id === botId)?.admin;
    if (!isBotAdmin) return sock.sendMessage(from, { text: "❌ Le bot doit être admin pour ajouter quelqu'un." });

    // --- 🧬 EXÉCUTION ---
    let user = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;
    if (!user) return sock.sendMessage(from, { text: "👤 Précisez le numéro à ajouter (ex: .add 242066969267)" });

    try {
        await sock.groupParticipantsUpdate(from, [user], "add");
        await sock.sendMessage(from, { text: `✅ @${user.split('@')[0]} a été intégré au clan.`, mentions: [user] });
    } catch (e) {
        await sock.sendMessage(from, { text: "⚠️ Impossible d'ajouter ce Shinobi. Son chakra est peut-être protégé (Privé)." });
    }
};
