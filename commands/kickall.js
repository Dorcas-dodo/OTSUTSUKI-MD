const config = require('../config');

module.exports = async (sock, m, args, { isOwner }) => {
    const from = m.key.remoteJid;

    try {
        // 1. SÉCURITÉ MAÎTRE ABSOLUE
        if (!isOwner) {
            return sock.sendMessage(from, { text: "🏮 Seul le Grand Maître peut déclencher la Purge Totale." });
        }

        // 2. VÉRIFICATION GROUPE
        if (!from.endsWith('@g.us')) {
            return sock.sendMessage(from, { text: "Cette technique ne s'utilise que dans un temple (groupe)." });
        }

        // 3. INFOS GROUPE & BOT
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = participants.find(p => p.id === botId)?.admin;

        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ Erreur : Je dois être admin pour exécuter la sentence divine." });
        }

        // 4. FILTRAGE DES CIBLES (On protège le bot et le maître 242066969267)
        // On ne cible que ceux qui ne sont pas l'Owner et qui ne sont pas le bot
        const victims = participants.filter(p => 
            p.id !== botId && 
            !p.id.includes('242066969267') && 
            !p.id.includes(config.OWNER_NUMBER?.replace(/[^0-9]/g, ''))
        );

        if (victims.length === 0) {
            return sock.sendMessage(from, { text: "🏮 Aucun Shinobi indésirable trouvé dans cette dimension." });
        }

        await sock.sendMessage(from, { 
            text: `🔥 *PURGE DES SIX CHEMINS EN COURS...*\n\nExécution de ${victims.length} Shinobis.\nLa paix revient dans 3, 2, 1...` 
        });

        // 5. EXÉCUTION EN BOUCLE AVEC DÉLAI (Sécurité Anti-Ban)
        for (let v of victims) {
            try {
                await sock.groupParticipantsUpdate(from, [v.id], "remove");
                // Pause de 700ms entre chaque kick pour ne pas se faire bannir par WhatsApp
                await new Promise(resolve => setTimeout(resolve, 700));
            } catch (err) {
                console.log(`Échec de l'exil pour : ${v.id}`);
            }
        }

        await sock.sendMessage(from, { text: "✅ La dimension a été nettoyée. Le silence est d'or." });

    } catch (e) {
        console.error("Erreur Kickall :", e);
        sock.sendMessage(from, { text: "❌ La purge a été interrompue. Chakra instable." });
    }
};
