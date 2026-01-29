const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { ffmpeg } = require('fluent-ffmpeg'); // Assure-toi d'avoir ffmpeg installé sur Koyeb
const stream = require('stream');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
        const mime = (quoted.imageMessage || quoted.videoMessage || quoted.viewOnceMessageV2?.message?.imageMessage)?.mimetype || '';

        if (!/image|video/.test(mime)) return sock.sendMessage(from, { text: "🏮 Répondez à une image ou une vidéo courte." });

        // 1. Détection du type
        const isVideo = mime.includes('video');
        const messageType = isVideo ? 'video' : 'image';
        const content = quoted.viewOnceMessageV2?.message?.[isVideo ? 'videoMessage' : 'imageMessage'] || quoted[isVideo ? 'videoMessage' : 'imageMessage'];

        // 2. Téléchargement rapide en mémoire
        const download = await downloadContentFromMessage(content, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of download) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 3. Envoi direct comme Sticker
        // Baileys gère la conversion automatique si ffmpeg est présent
        await sock.sendMessage(from, { 
            sticker: buffer,
            contextInfo: {
                externalAdReply: {
                    title: "ＯＴＳＵＴＳＵＫＩ ＳＴＩＣＫＥＲ",
                    body: "Conversion réussie ✅",
                    mediaType: 1,
                    thumbnailUrl: config.MENU_IMG
                }
            }
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Erreur lors de la création du sceau." });
    }
};
