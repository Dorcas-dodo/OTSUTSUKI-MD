module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;

        // --- 1. VÉRIFICATION SI GROUPE ---
        if (!from.endsWith('@g.us')) {
            return m.reply("🏮 Cette technique ne fonctionne que dans les temples (groupes).");
        }

        // --- 2. RÉCUPÉRATION DES DROITS (TA LOGIQUE) ---
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = m.key.participant || m.key.remoteJid;

        const isAdmin = participants.find(p => p.id === sender)?.admin;
        const botNumber = sock.user.id.split(':')[0];
        const isBotAdmin = participants.find(p => p.id.includes(botNumber))?.admin;

        // --- 3. LOGIQUE DE PERMISSION ---
        if (!isOwner && !isAdmin) {
            return sock.sendMessage(from, { text: "🏮 Seuls les hauts gradés ou le Maître peuvent élever un Shinobi." });
        }

        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ Action impossible : L'Otsutsuki-MD n'est pas Administrateur de ce groupe." });
        }

        // --- 4. RÉCUPÉRATION DE LA CIBLE ---
        // On vérifie : mention dans le texte, réponse à un message, ou numéro en argument
        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                     m.message?.extendedTextMessage?.contextInfo?.participant || 
                     (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!target) {
            return m.reply("🏮 Mentionne ou réponds au Shinobi à nommer Administrateur.");
        }

        // --- 5. EXÉCUTION DE LA PROMOTION ---
        await sock.groupParticipantsUpdate(from, [target], "promote");

        await sock.sendMessage(from, { 
            text: `✨ *PROMOTION* : Le Shinobi @${target.split('@')[0]} a été élevé au rang d'Administrateur par décret du clan.`, 
            mentions: [target] 
        });

    } catch (e) {
        console.error("Erreur Promote :", e);
        m.reply("⚠️ Le flux de chakra est perturbé. Impossible de promouvoir ce membre.");
    }
};
