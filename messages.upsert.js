module.exports = async (sock, chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m.message) return;
        const from = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text;

        // Commande de test simple
        if (text === 'test') {
            await sock.sendMessage(from, { text: 'OTSUTSUKI-MD est actif ! 🚀' });
        }
        
        // Commande Menu
        if (text === '.menu') {
            await sock.sendMessage(from, { text: 'Bienvenue sur OTSUTSUKI-MD\n\nCommandes disponibles :\n- test\n- .ping' });
        }
    } catch (err) {
        console.log("Erreur dans le handler de messages :", err);
    }
};
