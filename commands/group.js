const config = require('../config');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;

        // 1. VÉRIFICATION GROUPE
        if (!from.endsWith('@g.us')) return;

        // 2. SÉCURITÉ MAÎTRE OU ADMIN
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = m.key.participant || m.key.remoteJid;
        
        const isAdmin = participants.find(p => p.id === sender)?.admin;

        // Autorise si l'utilisateur est soit l'Owner (toi), soit un Admin du groupe
        if (!isOwner && !isAdmin) {
            return sock.sendMessage(from, { text: "🏮 Seuls les hauts gradés du clan peuvent modifier les sceaux du groupe." });
        }

        // 3. VÉRIFICATION ADMIN BOT
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = participants.find(p => p.id === botId)?.admin;

        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "⚠️ Le bot doit être admin pour sceller ce groupe." });
        }

        // 4. LOGIQUE D'OUVERTURE / FERMETURE
        const action = args[0]?.toLowerCase();

        if (action === 'close' || action === 'fermer') {
            await sock.groupSettingUpdate(from, 'announcement');
            await sock.sendMessage(from, { 
                text: "🏮 *SCEAU D'ANNONCE ACTIVÉ* 🏮\n\nLe flux de chakra est restreint. Seuls les admins peuvent parler.",
                contextInfo: { externalAdReply: { title: "ＯＴＳＵＴＳＵＫＩ ＳＥＡＬ", body: "Group Status: Closed", mediaType: 1, renderLargerThumbnail: false, thumbnailUrl: config.MENU_IMG }}
            });
        } 
        else if (action === 'open' || action === 'ouvrir') {
            await sock.groupSettingUpdate(from, 'not_announcement');
            await sock.sendMessage(from, { 
                text: "🔓 *SCEAU D'ANNONCE LIBÉRÉ* 🔓\n\nLe flux de chakra est rétabli. Tous les Shinobis peuvent s'exprimer.",
                contextInfo: { externalAdReply: { title: "ＯＴＳＵＴＳＵＫＩ ＳＥＡＬ", body: "Group Status: Open", mediaType: 1, renderLargerThumbnail: false, thumbnailUrl: config.MENU_IMG }}
            });
        } 
        else {
            await sock.sendMessage(from, { text: `🏮 *USAGE CORRECT* :\n◦ ${config.PREFIXE}group open\n◦ ${config.PREFIXE}group close` });
        }

    } catch (e) {
        console.error("Erreur commande Group :", e);
        await sock
