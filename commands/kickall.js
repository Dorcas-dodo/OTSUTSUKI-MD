const isAdmin = require('../lib/isAdmin');

module.exports = {
    name: "kickall",
    async execute(sock, from, msg, args, config) {
        if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: "❌ Cette commande est réservée aux groupes." });

        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, from, msg.key.participant || msg.key.remoteJid);
        
        if (!isSenderAdmin) return sock.sendMessage(from, { text: "❌ Seul un administrateur peut lancer un nettoyage total." });
        if (!isBotAdmin) return sock.sendMessage(from, { text: "⚠️ Le bot doit être *admin*." });

        await sock.sendMessage(from, { text: "🔄 *OTSUTSUKI-MD* commence le nettoyage du groupe... Adieu les membres !" });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;

        for (let member of participants) {
            // Ne pas expulser le bot lui-même ni les admins
            if (member.id !== sock.user.id.split(':')[0] + '@s.whatsapp.net' && !member.admin) {
                await sock.groupParticipantsUpdate(from, [member.id], "remove");
                // Petit délai pour éviter le bannissement par WhatsApp
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        await sock.sendMessage(from, { text: "✅ Nettoyage terminé. Seuls les admins sont restés." });
    }
};