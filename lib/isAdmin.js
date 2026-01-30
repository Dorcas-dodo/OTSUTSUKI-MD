async function isAdmin(sock, chatId, senderId) {
    if (!chatId.endsWith('@g.us')) return { isSenderAdmin: false, isBotAdmin: false };

    try {
        // Récupération fraîche
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;
        
        // Identifiants propres
        const botId = sock.user.id.split(':')[0]; // Juste le numéro
        const senderIdClean = senderId.split(':')[0];

        const bot = participants.find(p => p.id.startsWith(botId));
        const sender = participants.find(p => p.id.startsWith(senderIdClean));

        // LOG DE DEBUG (Regarde ton terminal quand tu tapes une commande)
        console.log(`🔍 [DEBUG ADMIN] Bot: ${botId} | Admin: ${!!bot?.admin}`);

        return {
            isSenderAdmin: !!(sender?.admin || sender?.isSuperAdmin),
            isBotAdmin: !!(bot?.admin || bot?.isSuperAdmin) 
        };
    } catch (e) {
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}
module.exports = isAdmin;
