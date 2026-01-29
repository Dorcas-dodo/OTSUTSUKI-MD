module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        await sock.chatModify({ delete: true, lastMessages: [{ key: m.key, messageTimestamp: m.messageTimestamp }] }, from);
        await sock.sendMessage(from, { text: "✨ *Chat purifié par le pouvoir Otsutsuki.*" });
    } catch (e) {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Impossible de purifier ce chat." });
    }
};
