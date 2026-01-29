module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    if (!from.endsWith('@g.us')) return;

    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = participants.find(p => p.id === botId)?.admin;

    if (!isBotAdmin) return sock.sendMessage(from, { text: "⚠️ Le bot doit être admin pour sceller ce groupe." });

    if (args[0] === 'close' || args[0] === 'fermer') {
        await sock.groupSettingUpdate(from, 'announcement');
        await sock.sendMessage(from, { text: "🏮 *GROUPE SCELLÉ :* Seuls les admins peuvent parler." });
    } else if (args[0] === 'open' || args[0] === 'ouvrir') {
        await sock.groupSettingUpdate(from, 'not_announcement');
        await sock.sendMessage(from, { text: "🔓 *GROUPE OUVERT :* Tous les shinobis peuvent parler." });
    } else {
        await sock.sendMessage(from, { text: "🏮 Usage : .group open/close" });
    }
};
