async function isAdmin(sock, chatId, senderId) {
    // Si ce n'est pas un groupe, personne n'est admin
    if (!chatId || !chatId.endsWith('@g.us')) return { isSenderAdmin: false, isBotAdmin: false };

    try {
        // Récupération des données en temps réel pour éviter le cache périmé
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;
        
        // Nettoyage des identifiants (on garde juste les chiffres)
        const botId = sock.user.id.split(':')[0];
        const senderIdClean = senderId ? senderId.split(':')[0] : "";

        // Recherche des participants dans la liste du groupe
        const bot = participants.find(p => p.id.startsWith(botId));
        const sender = participants.find(p => p.id.startsWith(senderIdClean));

        // Un participant est admin si son champ 'admin' est soit 'admin' soit 'superadmin' (donc pas null)
        const isBotAdmin = !!(bot && bot.admin !== null);
        const isSenderAdmin = !!(sender && sender.admin !== null);

        // LOG DE DEBUG pour Koyeb
        console.log(`🔍 [ADMIN CHECK] Bot(${botId}): ${isBotAdmin} | Sender(${senderIdClean}): ${isSenderAdmin}`);

        return { isSenderAdmin, isBotAdmin };
    } catch (e) {
        console.error("❌ Erreur dans la fonction isAdmin :", e);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

module.exports = isAdmin;
