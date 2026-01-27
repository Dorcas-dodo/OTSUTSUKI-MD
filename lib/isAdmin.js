/**
 * Vérifie les privilèges admin dans un groupe
 * @param {Object} sock - Instance Baileys
 * @param {String} chatId - ID du groupe
 * @param {String} senderId - ID de celui qui envoie le message
 */
async function isAdmin(sock, chatId, senderId) {
    // Si ce n'est pas un groupe, on retourne faux
    if (!chatId.endsWith('@g.us')) {
        return { isSenderAdmin: false, isBotAdmin: false };
    }

    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;
        
        // On récupère l'ID du bot proprement
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        const sender = participants.find(p => p.id === senderId);
        const bot = participants.find(p => p.id === botId);

        return {
            isSenderAdmin: sender?.admin !== null && sender?.admin !== undefined,
            isBotAdmin: bot?.admin !== null && bot?.admin !== undefined
        };
    } catch (e) {
        console.error("Erreur isAdmin:", e);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

module.exports = isAdmin;