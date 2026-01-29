const axios = require('axios');

module.exports = async (sock, m, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(m.key.remoteJid, { text: "🏮 Posez votre question à l'esprit Otsutsuki." });

    try {
        // Utilisation d'une API gratuite (exemple : Simsimi ou autre GPT free)
        const response = await axios.get(`https://api.simsimi.vn/v1/simtalk?text=${encodeURIComponent(text)}&lc=fr`);
        await sock.sendMessage(m.key.remoteJid, { text: `👁️‍🗨️ *OTSUTSUKI-AI* :\n\n${response.data.message}` }, { quoted: m });
    } catch (e) {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Connexion avec l'au-delà interrompue." });
    }
};
