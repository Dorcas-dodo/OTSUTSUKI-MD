const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        // 1. Récupérer le message cité (quoted)
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(from, { text: "🏮 Répondez à un message à vue unique." }, { quoted: m });
        }

        // 2. Extraire le contenu réel (gestion de la structure V2)
        // On cherche 'viewOnceMessage' ou 'viewOnceMessageV2'
        const viewOnce = quoted.viewOnceMessageV2 || quoted.viewOnceMessage;
        
        if (!viewOnce) {
            return sock.sendMessage(from, { text: "🏮 Ce n'est pas un message à vue unique (ou déjà ouvert)." }, { quoted: m });
        }

        // 3. Déterminer si c'est une image ou une vidéo
        const mediaType = Object.keys(viewOnce.message)[0]; // imageMessage ou videoMessage
        const mediaData = viewOnce.message[mediaType];

        if (!['imageMessage', 'videoMessage'].includes(mediaType)) {
            return sock.sendMessage(from, { text: "🏮 Type de média non supporté." }, { quoted: m });
        }

        // 4. Téléchargement du chakra (média)
        const stream = await downloadContentFromMessage(
            mediaData, 
            mediaType === 'imageMessage' ? 'image' : 'video'
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 5. Envoi en privé (DM) pour plus de discrétion
        const caption = `👁️‍🗨️ *DÉCRYPTAGE OTSUTSUKI*\n\n👤 *De :* @${sender.split('@')[0]}\n🧬 *Type :* ${mediaType === 'imageMessage' ? 'PHOTO' : 'VIDÉO'}`;

        await sock.sendMessage(sender, { 
            [mediaType === 'imageMessage' ? 'image' : 'video']: buffer, 
            caption: caption,
            mentions: [sender]
        });

        // Confirmation dans le groupe
        if (from.endsWith('@g.us')) {
            await sock.sendMessage(from, { text: "✅ Chakra capturé. Le média a été envoyé dans vos messages privés." }, { quoted: m });
        }

    } catch (e) {
        console.error("Erreur VV :", e);
        await sock.sendMessage(m.key.remoteJid, { text: "❌ L'œil divin n'a pas pu lire ce message. Il est possible qu'il ait déjà été expiré." });
    }
};
