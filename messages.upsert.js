module.exports = async (sock, chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m || !m.message) return;

        // Empêcher le bot de se répondre à lui-même
        if (m.key.fromMe) return;

        const from = m.key.remoteJid;
        // Extraction du texte pour gérer les messages simples et les réponses (quid/extended)
        const text = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.buttonsResponseMessage?.selectedButtonId || 
                     "";

        const prefix = "."; // Ton préfixe par défaut
        const command = text.toLowerCase();

        // --- LOGIQUE DES COMMANDES ---

        // Commande : test
        if (command === 'test') {
            await sock.sendMessage(from, { text: 'OTSUTSUKI-MD est actif et prêt à servir ! 🚀' });
        }
        
        // Commande : .menu
        if (command === prefix + 'menu') {
            const menuText = `*───『 OTSUTSUKI-MD 』───*

✨ *Utilisateur* : @${from.split('@')[0]}
🛠 *Préfixe* : [ ${prefix} ]

*LISTE DES COMMANDES :*
┌─
│ 🤖 *Bot* : test, .ping
│ 👤 *Info* : .owner, .runtime
└─

> Propulsé par Celes System`;
            await sock.sendMessage(from, { text: menuText, mentions: [from] });
        }

        // Commande : .ping
        if (command === prefix + 'ping') {
            const start = Date.now();
            await sock.sendMessage(from, { text: 'Calcul du ping...' });
            const end = Date.now();
            await sock.sendMessage(from, { text: `🚀 Vitesse de réponse : *${end - start}ms*` });
        }

        // Commande : .owner
        if (command === prefix + 'owner') {
            await sock.sendMessage(from, { 
                text: "👤 *Propriétaire* : Celes\n🔗 *GitHub* : github.com/Dorcas-dodo" 
            });
        }

    } catch (err) {
        console.log("⚠️ Erreur dans le handler de messages :", err);
    }
};
