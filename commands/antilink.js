const config = require('../config');

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const isOwner = sender.includes(config.OWNER_NUMBER) || m.key.fromMe;

    if (!isOwner) return sock.sendMessage(from, { text: "🚷 Seul l'Owner peut modifier les barrières du clan." });

    if (!args[0]) return sock.sendMessage(from, { text: `🏮 Usage : ${config.PREFIXE}antilink on/off` });

    if (args[0] === 'on') {
        config.ANTILINK = "true";
        await sock.sendMessage(from, { text: "🛡️ *Protection activée :* Tout lien externe sera puni d'expulsion." });
    } else if (args[0] === 'off') {
        config.ANTILINK = "false";
        await sock.sendMessage(from, { text: "🔓 *Protection désactivée :* Les barrières du groupe sont levées." });
    }
};
