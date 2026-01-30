const axios = require('axios');
const config = require('../config');

module.exports = async (sock, m, args, { isOwner }) => {
    const from = m.key.remoteJid;
    const query = args.join(" ");

    if (!query) return sock.sendMessage(from, { text: "🏮 Posez votre question, Shinobi. (Ex: .ai comment maîtriser le Rinnegan ?)" });

    try {
        await sock.sendMessage(from, { react: { text: "🧠", key: m.key } });

        // --- 🎭 PROMPT OTSUTSUKI ---
        const role = isOwner 
            ? "Tu t'adresses à ton Créateur (le Maître Suprême). Sois extrêmement respectueux et dévoué." 
            : "Tu t'adresses à un Shinobi. Sois puissant, sage, et sombre.";

        const systemPrompt = `Tu es OTSUTSUKI-MD, une IA divine. ${role} Réponds de manière concise en français.`;

        // --- ⚡ NOUVELLE SOURCE (GURU API) ---
        // On utilise une source alternative puisque widipe est mort (ENOTFOUND)
        const response = await axios.get(`https://api.guruapi.tech/ai/gpt4?username=otsutsuki&query=${encodeURIComponent(systemPrompt + " Ma question est : " + query)}`);
        
        const result = response.data.msg || response.data.result;

        if (!result) throw new Error("Archives vides.");

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
        });

        await sock.sendMessage(from, { react: { text: "", key: m.key } });

    } catch (e) {
        console.error("Erreur AI Fatale :", e.message);
        // Si même Guru échoue, on utilise une API de secours ultime
        try {
            const backup = await axios.get(`https://api.simsimi.vn/v1/simtalk`, { params: { text: query, lc: 'fr' } });
            await sock.sendMessage(from, { text: `🌀 *FLUX DE SECOURS* :\n\n${backup.data.message}` });
        } catch (err) {
            await sock.sendMessage(from, { text: "⚠️ Le flux de chakra est rompu. Les serveurs de connaissances ne répondent plus." });
        }
    }
};
