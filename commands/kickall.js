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
        // Si tu n'es pas le Maître (isOwner) ET que tu n'es pas Admin du groupe -> BLOQUAGE
        if (!isOwner && !isAdmin) {
            return sock.sendMessage(from, { text: "🏮 Seul le Grand Maître ou un Administrateur peut déclencher la Purge." });
        }

        // 3. VÉRIFICATION ADMIN BOT
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = participants.find(p => p.id === botId)?.admin;

        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ Le bot doit être admin pour purifier cette dimension." });
        }

        // 4. FILTRAGE DES VICTIMES
        // On exclut : Le bot lui-même, l'Owner (toi), et les admins du groupe
        const victims = participants.filter(p => 
            p.id !== botId && 
            !p.id.includes('242066969267') && 
            !p.id.includes(config.OWNER_NUMBER?.replace(/[^0-9]/g, '')) &&
            !p.admin // On ne kicke pas les autres admins pour éviter les crashs de groupe
        );

        if (victims.length === 0) {
            return sock.sendMessage(from, { text: "🏮 Aucun Shinobi de bas rang à purger." });
        }

        // 5. EXÉCUTION
        await sock.sendMessage(from, { 
            text: `🔥 *PURGE DES SIX CHEMINS* 🔥\n\nElimination de ${victims.length} Shinobis...\nLa paix sera bientôt rétablie.` 
        });

        for (let v of victims) {
            await sock.groupParticipantsUpdate(from, [v.id], "remove");
            // Délai de sécurité pour éviter le ban WhatsApp (800ms)
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        await sock.sendMessage(from, { text: "✅ *DIMENSION PURIFIÉE.*" });

    } catch (e) {
        console.error("Erreur Kickall :", e);
        await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Le chakra est trop instable pour terminer la purge." });
    }
};
