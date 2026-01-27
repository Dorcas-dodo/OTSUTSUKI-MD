const fs = require('fs');

module.exports = {
    name: "ban",
    async execute(sock, from, msg, args, config) {
        const mention = msg.message.extendedTextMessage?.contextInfo?.mentionedJid[0] || (msg.message.extendedTextMessage?.contextInfo?.participant ? [msg.message.extendedTextMessage.contextInfo.participant] : []);
        
        if (!mention[0]) return sock.sendMessage(from, { text: "⚠️ Mentionne l'utilisateur à bannir de OTSUTSUKI-MD." });

        let banned = JSON.parse(fs.readFileSync('./data/banned.json') || "[]");
        if (!banned.includes(mention[0])) {
            banned.push(mention[0]);
            fs.writeFileSync('./data/banned.json', JSON.stringify(banned));
            await sock.sendMessage(from, { text: `✅ @${mention[0].split('@')[0]} a été banni du bot.`, mentions: [mention[0]] });
        } else {
            await sock.sendMessage(from, { text: "ℹ️ Cet utilisateur est déjà banni." });
        }
    }
};