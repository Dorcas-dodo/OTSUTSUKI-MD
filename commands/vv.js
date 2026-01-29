const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        // 1. Vérifier si on répond à un message
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(from, { text: "🏮 Répondez à un message à vue unique (photo/vidéo)." }, { quoted: m });
        }

        // 2. Détecter le type de message (V2 ou standard)
        const type = Object.keys(quoted)[0];
        let viewOnce;

        if (type === 'viewOnceMessageV2' || type === 'viewOnceMessage') {
            viewOnce = quoted[type].message;
        } else {
            return sock.sendMessage(from, { text: "🏮 Ce n'est pas un message à vue unique." }, { quoted: m });
        }

        const mediaType = Object.keys(viewOnce)[0]; // imageMessage ou videoMessage
        if (!['imageMessage', 'videoMessage'].includes(mediaType)) {
            return sock.sendMessage(from, { text: "🏮 Format non supporté." }, { quoted: m });
        }

        // 3. Téléchargement du média
        const stream = await downloadContentFromMessage(
            viewOnce[mediaType], 
            mediaType === 'imageMessage' ? 'image' : 'video'
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 4. Envoi en PRIVE (DM)
        const caption = `👁️‍🗨️ *DÉCRYPTAGE OTSUTSUKI*\n\n👤 *De :* @${sender.split('@')[0]}\n📍 *Source :* ${from.endsWith('@g.us') ? 'Groupe' : 'Privé'}`;

        await sock.sendMessage(sender, { 
            [mediaType === 'imageMessage' ? 'image' : 'video']: buffer, 
            caption: caption,
            mentions: [sender]
        });

        // 5. Confirmation discrète dans le groupe
        if (from.endsWith('@g.us')) {
            await sock.sendMessage(from, { text: "✅ Média envoyé dans vos messages privés." }, { quoted: m });
        }

    } catch (e) {
        console.error("Erreur VV :", e);
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Échec de la capture du chakra." });
    }
};
