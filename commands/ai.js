const axios = require('axios');
const config = require('../config');

module.exports = async (sock, m, args, { isOwner }) => {
    const from = m.key.remoteJid;
    const query = args.join(" ");

    if (!query) {
        return sock.sendMessage(from, { text: "🏮 Posez votre question, Shinobi. (Ex: .ai comment maîtriser le Rinnegan ?)" }, { quoted: m });
    }

    try {
        // Réaction de réflexion
        await sock.sendMessage(from, { react: { text: "🧠", key: m.key } });

        // --- 🎭 PROMPT OTSUTSUKI ---
        const role = isOwner 
            ? "Tu t'adresses à ton Créateur (le Maître Suprême). Sois extrêmement respectueux et dévoué." 
            : "Tu t'adresses à un Shinobi. Sois puissant, sage, et sombre.";

        const systemPrompt = `Tu es OTSUTSUKI-MD, une IA divine. ${role} Réponds de manière concise en français.`;

        let result = "";

        // --- ⚡ FLUX PRINCIPAL (SANDIP API - Très stable) ---
        try {
            const response = await axios.get(`https://sandipbaruwal.onrender.com/gpt?prompt=${encodeURIComponent(systemPrompt + " Ma question est : " + query)}`);
            result = response.data.answer;
        } catch (err) {
            console.error("Erreur Flux 1:", err.message);
            // --- ⚡ FLUX DE SECOURS (SIMSIMI) ---
            const backup = await axios.get(`https://api.simsimi.vn/v1/simtalk`, { params: { text: query, lc: 'fr' } });
            result = backup.data.message + "\n\n*(Note: Flux de secours activé)*";
        }

        if (!result || result.length < 2) throw new Error("Réponse vide");

        const aiMsg = `╔════════════════════╗\n  ⛩️  *SAGESSE OTSUTSUKI* ⛩️\n╚════════════════════╝\n\n📜 *QUESTION :* ${query}\n\n🌀 *RÉPONSE :*\n${result}\n\n🏮 *OTSUTSUKI-MD SYSTEM*`;

        await sock.sendMessage(from, { 
            text: aiMsg,
            contextInfo: {
                externalAdReply: {
                    title: "ＯＴＳＵＴＳＵＫＩ ＩＮＴＥＬ",
                    body: isOwner ? "Reconnaissance du Maître confirmée" : "Flux de connaissances divines",
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnailUrl: config.URL_RECURS,
                    sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                }
            }
        }, { quoted: m });

        // Retrait de la réaction
        await sock.sendMessage(from, { react: { text: "", key: m.key } });

    } catch (e) {
        console.error("Erreur AI Fatale :", e.message);
        await sock.sendMessage(from, { text: "⚠️ Le flux de chakra est rompu. Les archives sont inaccessibles, réessayez plus tard." }, { quoted: m });
    }
};
