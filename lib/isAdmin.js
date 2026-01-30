/**
 * Vérifie les privilèges admin dans un groupe
 * @param {Object} sock - Instance Baileys
 * @param {String} chatId - ID du groupe
 * @param {String} senderId - ID de celui qui envoie le message
 */
async function isAdmin(sock, chatId, senderId) {
    // Si ce n'est pas un groupe, on évite de gaspiller des ressources
    if (!chatId.endsWith('@g.us')) {
        return { isSenderAdmin: false, isBotAdmin: false };
    }

    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;
        
        // Extraction du numéro pur du bot (ex: 242066969267)
        const botNumber = sock.user.id.split(':')[0].split('@')[0];
        // Extraction du numéro pur de l'expéditeur
        const senderNumber = senderId.split(':')[0].split('@')[0];

        // On cherche les participants en comparant uniquement les numéros (plus fiable)
        const sender = participants.find(p => p.id.includes(senderNumber));
        const bot = participants.find(p => p.id.includes(botNumber));

        return {
            // Un participant est admin si p.admin vaut 'admin' ou 'superadmin'
            isSenderAdmin: !!(sender?.admin),
            isBotAdmin: !!(bot?.admin)
        };
    } catch (e) {
        console.error("Erreur isAdmin :", e);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

module.exports = isAdmin;
