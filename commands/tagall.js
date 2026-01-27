module.exports = {
    name: "tagall",
    async execute(sock, from, msg, args, config) {
        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants;
        
        let message = `📣 *ALERTE GÉNÉRALE*\n\n💬 Message : ${args.join(" ") || "Aucun"}\n\n`;
        let mentions = [];

        for (let participant of participants) {
            message += `@${participant.id.split('@')[0]} `;
            mentions.push(participant.id);
        }

        await sock.sendMessage(from, { text: message, mentions });
    }
};