const config = require('../config');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        // 1. VÉRIFICATION GROUPE
        if (!from.endsWith('@g.us')) {
            return sock.sendMessage(from, { text: "🏮 Cette technique ne peut être invoquée que dans un temple (groupe)." });
        }

        // 2. RÉCUPÉRATION DES DROITS
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const isAdmin = participants.find(p => p.id === sender)?.admin;

        // --- 🛡️ SÉCURITÉ MAÎTRE + ADMIN ---
        if (!isOwner && !isAdmin) {
            return sock.sendMessage(from, { text: "🏮 Seul le Grand Maître ou un Administrateur peut déclencher la Purge." });
        }

        // 3. VÉRIFICATION ADMIN BOT (MÉTHODE ROBUSTE)
        const botNumber = sock.user.id.split(':')[0];
        const isBotAdmin = participants.find(p => p.id.includes(botNumber))?.admin;

        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ Le bot doit être admin pour purifier cette dimension." });
        }

        // 4. FILTRAGE DES VICTIMES (PROTECTION RENFORCÉE)
        // On définit tes IDs de confiance pour ne pas te kick par erreur
        const master1 = '242066969267';
        const master2 = '225232933638352'; // Ton ID log actuel
        const ownerConf = config.OWNER_NUMBER?.replace(/[^0-9]/g, '');

        const victims = participants.filter(p => 
            !p.id.includes(botNumber) &&    // Exclure le bot
            !p.id.includes(master1) &&      // Exclure ton num Congo
            !p.id.includes(master2) &&      // Exclure ton ID bizarre
            !p.id.includes(ownerConf) &&    // Exclure le num config
            !p.admin                        // Exclure les autres admins
        );

        if (victims.length === 0) {
            return sock.sendMessage(from, { text: "🏮 Aucun Shinobi de bas rang à purger." });
        }

        // 5. EXÉCUTION
        await sock.sendMessage(from, { 
            text: `🔥 *PURGE DES SIX CHEMINS* 🔥\n\nÉlimination de ${victims.length} Shinobis...\nLa paix sera bientôt rétablie.` 
        });

        for (let v of victims) {
            await sock.groupParticipantsUpdate(from, [v.id], "remove");
            // Délai de sécurité légèrement augmenté (1 seconde) pour éviter le spam-ban
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await sock.sendMessage(from, { text: "✅ *DIMENSION PURIFIÉE.*" });

    } catch (e) {
        console.error("Erreur Kickall :", e);
        await sock.sendMessage(from, { text: "⚠️ Le chakra est trop instable pour terminer la purge." });
    }
};
