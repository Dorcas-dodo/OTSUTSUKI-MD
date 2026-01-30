const config = require('../config');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;

        // 1. SÉCURITÉ MAÎTRE (Utilise le passe-droit du Handler)
        if (!isOwner) {
            return sock.sendMessage(from, { 
                text: "⚠️ *ACCÈS REFUSÉ* : Seul le Grand Maître Otsutsuki peut manipuler le flux du système. ❌" 
            });
        }

        // 2. VÉRIFICATION DE L'ARGUMENT
        const targetMode = args[0]?.toLowerCase();

        if (!targetMode || (targetMode !== 'public' && targetMode !== 'self' && targetMode !== 'privé')) {
            return sock.sendMessage(from, { 
                text: `🏮 *CONFIGURATION DU MODE*\n\nUsage :\n◦ ${config.PREFIXE}mode public (Ouvert à tous)\n◦ ${config.PREFIXE}mode self (Réservé au Maître)` 
            });
        }

        // 3. LOGIQUE DE BASCULEMENT
        if (targetMode === 'public') {
            config.MODE = 'public';
            await sock.sendMessage(from, { 
                text: "🌐 *DIMENSION OUVERTE*\n\nLe système est désormais en mode **PUBLIC**. Tous les Shinobis peuvent invoquer les pouvoirs de l'Otsutsuki-MD. ✅" 
            });
        } 
        else if (targetMode === 'self' || targetMode === 'privé') {
            config.MODE = 'self';
            await sock.sendMessage(from, { 
                text: "🔐 *DIMENSION SCELLÉE*\n\nLe système est désormais en mode **PRIVÉ**. L'Otsutsuki-MD ne répondra qu'à son Maître unique. 🌑" 
            });
        }

        // Note : Pour que le changement soit définitif même après un reboot sur Koyeb,
        // il faudrait modifier les variables d'environnement sur Koyeb directement.
        // Ce code change le mode pour la session actuelle.

    } catch (e) {
        console.error("Erreur Mode :", e);
        await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Erreur lors de la transition dimensionnelle." });
    }
};
