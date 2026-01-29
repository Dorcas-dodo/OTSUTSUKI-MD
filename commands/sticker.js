const { Sticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const config = require('../config');

    // On vérifie si c'est une image ou une vidéo qui est envoyée ou citée (reply)
    const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const mime = (m.message.imageMessage || m.message.videoMessage) 
                 ? (m.message.imageMessage?.mimetype || m.message.videoMessage?.mimetype) 
                 : (quoted?.imageMessage?.mimetype || quoted?.videoMessage?.mimetype);

    if (!mime) return sock.sendMessage(from, { text: "🏮 Envoie une image/vidéo ou réponds à une image avec *.sticker*" });

    try {
        // Téléchargement du média
        const messageToDownload = quoted ? quoted : m.message;
        const stream = await require('@whiskeysockets/baileys').downloadContentFromMessage(
            messageToDownload.imageMessage || messageToDownload.videoMessage,
            mime.split('/')[0]
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Création du sticker
        const sticker = new Sticker(buffer, {
            pack: config.BOT_NAME || 'Otsutsuki-MD', // Nom du pack
            author: config.OWNER_NAME || 'Clan Otsutsuki', // Nom de l'auteur
            type: StickerTypes.FULL, // Format complet (non rogné)
            categories: ['🤩', '🌀'], // Catégories
            id: '12345',
            quality: 70, // Qualité du sticker
        });

        const stickerBuffer = await sticker.toBuffer();
        
        // Envoi du sticker
        await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });

    } catch (err) {
        console.error("Erreur Sticker :", err);
        await sock.sendMessage(from, { text: "❌ Échec de la création du sticker. Assure-toi que l'image n'est pas trop lourde." });
    }
};
