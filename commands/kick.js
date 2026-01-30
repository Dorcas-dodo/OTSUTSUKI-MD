module.exports = async (sock, m, args, { isOwner }) => {
    const from = m.key.remoteJid;

    try {
        if (!from.endsWith('@g.us')) {
            return sock.sendMessage(from, { text: "🏮 Cette technique ne peut être utilisée que dans un temple (groupe)." }, { quoted: m });
        }

        // --- FORCE REFRESH ET DÉTECTION ROBUSTE ---
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        
        // On nettoie l'ID du bot pour la comparaison
        const botNumber = sock.user.id.split(':')[0];
        const botInGroup = participants.find(p => p.id.includes(botNumber));
        const isBotAdmin = !!(botInGroup?.admin || botInGroup?.isSuperAdmin);

        // DEBUG DANS TA CONSOLE
        console.log(`🔍 [VÉRIFICATION] Bot: ${botNumber} | Admin détecté: ${isBotAdmin}`);

        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ Erreur : L'Otsutsuki-MD doit être administrateur pour exiler quelqu'un." }, { quoted: m });
        }

        if (!isOwner) {
            return sock.sendMessage(from, { text: "🏮 Seul le Maître peut utiliser l'Exil." }, { quoted: m });
        }

        // --- RÉCUPÉRATION DE LA CIBLE ---
        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                     m.message?.extendedTextMessage?.contextInfo?.participant || 
                     (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!target || target === from) {
            return sock.sendMessage(from, { text: "🏮 Mentionnez ou répondez au message du Shinobi à bannir." }, { quoted: m });
        }

        // --- EXÉCUTION ---
        await sock.groupParticipantsUpdate(from, [target], "remove");
        
        await sock.sendMessage(from, { 
            text: `🌀 *EXIL RÉUSSI* : Le Shinobi @${target.split('@')[0]} a été envoyé dans une autre dimension.`, 
            mentions: [target] 
        }, { quoted: m });

    } catch (e) {
        console.error("Erreur technique kick:", e);
        await sock.sendMessage(from, { text: "⚠️ Le chakra est instable. Impossible d'exiler cette cible." }, { quoted: m });
    }
};
