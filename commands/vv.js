const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: "vv",
    async execute(sock, from, msg, args, config) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted || (!quoted.viewOnceMessageV2 && !quoted.viewOnceMessage)) {
            return sock.sendMessage(from, { text: "❌ Réponds à un message à vue unique (photo ou vidéo)." });
        }

        const viewOnce = quoted.viewOnceMessageV2 || quoted.viewOnceMessage;
        const type = Object.keys(viewOnce.message)[0];
        const media = viewOnce.message[type];

        // Téléchargement du média
        const stream = await downloadContentFromMessage(media, type === 'imageMessage' ? 'image' : 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

        const caption = `✅ *OTSUTSUKI-MD* a récupéré ton média éphémère !\n📌 *Type:* ${type === 'imageMessage' ? 'Photo' : 'Vidéo'}`;

        if (type === 'imageMessage') {
            await sock.sendMessage(from, { image: buffer, caption: caption }, { quoted: msg });
        } else if (type === 'videoMessage') {
            await sock.sendMessage(from, { video: buffer, caption: caption }, { quoted: msg });
        }
    }
};