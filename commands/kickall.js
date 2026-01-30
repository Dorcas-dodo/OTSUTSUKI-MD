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
        
        // --- 🔎 DÉTECTION DES RANGS ---
        const senderAdmin = participants.find(p => p.id === sender)?.admin;
        const botNumber = sock.user.id.split(':')[0];
        const isBotAdmin = participants.find(p => p.id.includes(botNumber))?.admin;

        // --- 🛡️ SÉCURITÉ MAÎTRE + ADMIN ---
        if (!isOwner && !senderAdmin) {
            return sock.sendMessage(from, { text: "🏮 Seul le Grand Maître ou un Administrateur peut déclencher la Purge." });
        }

        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ Le bot doit être admin pour purifier cette dimension." });
        }

        // 4. FILTRAGE DES VICTIMES (PROTECTION RENFORCÉE)
        const master1 = '242066969267';
        const master2 = '225232933638352'; 
        const ownerConf = config.OWNER_NUMBER?.replace(/[^0-9]/g, '');

        // On ne cible QUE ceux qui ne sont PAS admins et PAS dans la liste blanche
        const victims = participants.filter(p => 
            !p.id.includes(botNumber) &&    // Exclure le bot
            !p.id.includes(master1) &&      // Exclure Maître 1
            !p.id.includes(master2) &&      // Exclure Maître 2
            !p.id.includes(ownerConf) &&    // Exclure config
            !p.admin                        // Exclure tous les Admins du groupe
        );

        if (victims.length === 0) {
            return sock.sendMessage(from, { text: "🏮 Aucun Shinobi de bas rang à purger dans cette dimension." });
        }

        // 5. EXÉCUTION DU SHINRA TENSEI
        await sock.sendMessage(from, { 
            text: `🔥 *SHINRA TENSEI* 🔥\n\nÉlimination de ${victims.length} Shinobis...\nLe monde connaîtra la douleur, puis la paix.` 
        });

        for (let v of victims) {
            // On retire le membre
            await sock.groupParticipantsUpdate(from, [v.id], "remove");
            
            // Délai de sécurité (1 seconde) pour éviter que WhatsApp ne bloque le bot pour spam
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await sock.sendMessage(from, { text: "✅ *DIMENSION PURIFIÉE.* La paix est rétablie." });

    } catch (e) {
        console.error("Erreur Kickall :", e);
        await sock.sendMessage(from, { text: "⚠️ Le chakra est trop instable pour terminer la purge." });
    }
};
