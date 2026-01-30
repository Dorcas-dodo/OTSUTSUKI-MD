module.exports = async (sock, m, args, { isOwner }) => {
    const from = m.key.remoteJid;

    try {
        if (!from.endsWith('@g.us')) {
            return sock.sendMessage(from, { text: "🏮 Cette technique ne s'utilise que dans un groupe." }, { quoted: m });
        }

        // --- 🔎 RÉCUPÉRATION ET REFRESH DES DROITS ---
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        
        // On récupère le numéro pur du bot (ex: 242066969267) sans les suffixes :1@s.wha...
        const botNumber = (sock.user.id.split(':')[0] || sock.user.id).split('@')[0];
        
        // On cherche le bot dans la liste en comparant uniquement le numéro
        const botInGroup = participants.find(p => p.id.startsWith(botNumber));
        const isBotAdmin = !!(botInGroup && (botInGroup.admin === 'admin' || botInGroup.isSuperAdmin || botInGroup.admin === 'superadmin'));

        // Debug console pour voir ce que le bot "pense" réellement
        console.log(`🔍 [VÉRIF ADMIN] Bot Num: ${botNumber} | Statut Admin: ${isBotAdmin}`);

        if (!isBotAdmin) {
            return sock.sendMessage(from, { 
                text: "❌ Action impossible : L'Otsutsuki-MD n'est pas Administrateur.\n\n💡 *Note :* Si je suis admin, retire-moi et remets-moi admin pour rafraîchir mon Chakra." 
            }, { quoted: m });
        }

        if (!isOwner) {
            const sender = m.key.participant || m.key.remoteJid;
            const senderInGroup = participants.find(p => p.id === sender);
            const isAdmin = !!(senderInGroup?.admin);
            if (!isAdmin) return sock.sendMessage(from, { text: "🏮 Seul un haut gradé ou le Maître peut promouvoir." }, { quoted: m });
        }

        // --- CIBLE ---
        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                     m.message?.extendedTextMessage?.contextInfo?.participant || 
                     (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!target) return sock.sendMessage(from, { text: "🏮 Mentionne le Shinobi à promouvoir." }, { quoted: m });

        // --- ACTION ---
        await sock.groupParticipantsUpdate(from, [target], "promote");
        
        await sock.sendMessage(from, { 
            text: `✨ @${target.split('@')[0]} a été élevé au rang d'Administrateur.`, 
            mentions: [target] 
        }, { quoted: m });

    } catch (e) {
        console.error("Erreur Promote :", e);
        await sock.sendMessage(from, { text: "⚠️ Échec de la promotion. Le chakra est instable." }, { quoted: m });
    }
};
