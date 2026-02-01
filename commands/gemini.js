const axios = require("axios");

/**
 * Commande DeepSeek AI pour Otsutsuki-MD
 * @param {Object} sock - L'instance du socket Baileys
 * @param {String} chatId - L'identifiant de la conversation
 * @param {Object} message - Le message original (pour la réaction et la citation)
 * @param {String} query - La question posée par l'utilisateur
 */
async function deepseekCommand(sock, chatId, message, query) {
    try {
        // Ajoute une réaction 🤖 au message pour montrer que le bot réfléchit
        await sock.sendMessage(chatId, {
            react: { text: "🤖", key: message.key }
        });

        // URL de l'API avec le modèle DeepSeek
        const apiUrl = `https://all-in-1-ais.officialhectormanuel.workers.dev/?query=${encodeURIComponent(query)}&model=deepseek`;

        // Appel de l'API via axios
        const response = await axios.get(apiUrl);

        // Vérification de la réponse et envoi du message
        if (response.data && response.data.success && response.data.message?.content) {
            const answer = response.data.message.content;
            await sock.sendMessage(chatId, { text: answer }, { quoted: message });
        } else {
            throw new Error("Réponse Deepseek invalide");
        }
    } catch (error) {
        console.error("Erreur API Deepseek:", error.message);
        // Message d'erreur en cas d'échec technique
        await sock.sendMessage(chatId, { text: "❌ L'IA a échoué. Réessaie plus tard." }, { quoted: message });
    }
}

module.exports = { deepseekCommand };
