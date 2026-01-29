const config = require('../config');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        // 1. Vérifier si on est bien dans un groupe
        if (!isGroup) {
            return await sock.sendMessage(from, { text: "❌ Cette commande n'est utilisable que dans un groupe." });
        }

        // 2. Vérifier les permissions (Admin ou Owner)
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = m.key.participant || m.key.remoteJid;
        const isAdmin = participants.find(p => p.id === sender)?.admin;
        const isOwner = sender.includes(config.OWNER_NUMBER) || m.key.fromMe;

        if (!isAdmin && !isOwner) {
            return await sock.sendMessage(from, { text: "🚷 Seuls les administrateurs du clan peuvent utiliser le Tag." });
        }

        // 3. Récupérer le message à diffuser
        const message = args.join(" ") || "Message d'alerte Otsutsuki ! 🏮";
        
        // 4. Créer la liste des mentions (tous les participants)
        const mentions = participants.map(p => p.id);

        // 5. Envoyer le message avec les mentions invisibles
        await sock.sendMessage(from, {
            text: `📢 *ANNONCE DU CLAN* 📢\n\n${message}`,
            mentions: mentions
        }, { quoted: m });

    } catch (e) {
        console.error("❌ Erreur Tag :", e);
        await sock.sendMessage(m.key.remoteJid, { text: "L'œil du Rinnegan a échoué à taguer le groupe." });
    }
};
