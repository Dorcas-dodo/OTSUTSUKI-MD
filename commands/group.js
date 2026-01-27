module.exports = {
    name: "group",
    async execute(sock, from, msg, args, config) {
        if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: "❌ Cette commande ne marche qu'en groupe." });
        
        const action = args[0] ? args[0].toLowerCase() : "";
        
        if (action === "close" || action === "mute") {
            await sock.groupSettingUpdate(from, 'announcement');
            await sock.sendMessage(from, { text: "🔒 Groupe fermé. Seuls les admins peuvent écrire." });
        } else if (action === "open" || action === "unmute") {
            await sock.groupSettingUpdate(from, 'not_announcement');
            await sock.sendMessage(from, { text: "🔓 Groupe ouvert à tous !" });
        } else {
            await sock.sendMessage(from, { text: `Utilise : ${config.PREFIXE}group open ou close` });
        }
    }
};