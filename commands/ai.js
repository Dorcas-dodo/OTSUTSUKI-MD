const axios = require('axios');
const config = require('../config');

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const query = args.join(" ");

    if (!query) return sock.sendMessage(from, { text: "🏮 Posez votre question, Shinobi. (Ex: .ai comment maîtriser le Rinnegan ?)" });

    try {
        // Réaction pendant la recherche
        await sock.sendMessage(from, { react: { text: "🧠", key: m.key } });

        // Appel à l'IA (API gratuite via Heruku/Luminai)
        const response = await axios.get(`https://widipe.com/prompt/gpt?prompt=Tu es OTSUTSUKI-MD, une intelligence artificielle divine, puissante et sage. Tu t'adresses aux utilisateurs comme des Shinobis. Réponds de manière concise et sombre.&text=${encodeURIComponent(query)}`);
        
        const result = response.data.result;

        const aiMsg = `╔════════════════════╗
   ⛩️  *SAGESSE OTSUTSUKI* ⛩️
╚════════════════════╝

📜 *QUESTION :* ${query}

🌀 *RÉPONSE :*
${result}

🏮 *OTSUTSUKI-MD SYSTEM*`;

        await sock.sendMessage(from, { 
            text: aiMsg,
            contextInfo: {
                externalAdReply: {
                    title: "ＯＴＳＵＴＳＵＫＩ ＩＮＴＥＬ",
                    body: "Flux de connaissances activé",
                    mediaType: 1,
                    thumbnailUrl: config.URL_RECURS
                }
            }
        });

        // Retrait de la réaction
        await sock.sendMessage(from, { react: { text: "", key: m.key } });

    } catch (e) {
        console.error("Erreur AI :", e);
        await sock.sendMessage(from, { text: "⚠️ Les archives du clan sont inaccessibles pour le moment." });
    }
};
