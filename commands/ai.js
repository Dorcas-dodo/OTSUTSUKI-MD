const axios = require('axios');

module.exports = {
    name: "gpt",
    async execute(sock, from, msg, args, config) {
        if (!args[0]) return sock.sendMessage(from, { text: "Pose-moi une question !" });

        try {
            const query = args.join(" ");
            const res = await axios.get(`https://api.vreden.my.id/api/gpt4?text=${encodeURIComponent(query)}`);
            
            await sock.sendMessage(from, { text: `🤖 *OTSUTSUKI-AI* :\n\n${res.data.result}` }, { quoted: msg });
        } catch (e) {
            await sock.sendMessage(from, { text: "❌ L'IA est fatiguée, réessaie plus tard." });
        }
    }
};