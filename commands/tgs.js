const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const config = require('../config');

    // Vérifie si c'est une vidéo ou un GIF (cité ou envoyé)
    const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const mime = (m.message.videoMessage) 
                 ? m.message.videoMessage.mimetype 
                 : quoted?.videoMessage?.mimetype;

    // Si ce n'est pas une vidéo/GIF
    if (!mime || !mime.includes('video')) {
        return sock.sendMessage(from, { text: "🏮 Veuillez envoyer ou répondre à une courte vidéo/GIF avec *.tgs* pour en faire un sticker animé." });
    }

    try {
        const messageToDownload = quoted ? quoted : m.message;
        
        // Téléchargement du média
        const stream = await downloadContentFromMessage(
            messageToDownload.videoMessage,
            'video'
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Création du sticker animé
        const sticker = new Sticker(buffer, {
            pack: config.BOT_NAME || 'Otsutsuki-MD',
            author: config.OWNER_NAME || 'Clan Otsutsuki',
            type: StickerTypes.FULL,
            categories: ['🔥', '🌀'],
            quality: 50 // Qualité réduite pour les stickers animés (limite de taille WhatsApp)
        });

        const stickerBuffer = await sticker.toBuffer();

        // Envoi
        await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });

    } catch (err) {
        console.error("Erreur TGS :", err);
        await sock.sendMessage(from, { text: "❌ Erreur lors de la conversion. La vidéo est peut-être trop longue (max 7-10 sec)." });
    }
};
