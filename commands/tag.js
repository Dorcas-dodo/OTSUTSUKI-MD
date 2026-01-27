module.exports = {
    name: "tag",
    async execute(sock, from, msg, args, config) {
        if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: "❌ Cette commande est réservée aux groupes." });

        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants;
        const message = args.join(" ") || "📢 Message d'OTSUTSUKI-MD";

        let text = `*〔 TAG ALL 〕*\n\n*Message:* ${message}\n\n`;
        let mentions = [];

        for (let p of participants) {
            text += `🔹 @${p.id.split('@')[0]}\n`;
            mentions.push(p.id);
        }

        await sock.sendMessage(from, { text: text, mentions: mentions }, { quoted: msg });
    }
};