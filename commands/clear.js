module.exports = {
    name: "clear",
    async execute(sock, from, msg, args, config) {
        if (!msg.key.fromMe) return sock.sendMessage(from, { text: "❌ Seul mon Master peut utiliser cette commande." });
        
        await sock.chatModify({ delete: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, from);
        await sock.sendMessage(from, { text: "🧹 Chat nettoyé avec succès par OTSUTSUKI-MD !" });
    }
};