module.exports = async (sock, m, args) => {
    const from = m.chat; // Utilise m.chat défini par ton nettoyeur smsg
    const start = Date.now();
    
    // On envoie le premier message et on récupère sa clé pour l'éditer plus tard
    const msg = await sock.sendMessage(from, { text: "⚡ *Analyse du flux de Chakra...*" }, { quoted: m });
    
    const end = Date.now();
    const latence = end - start;
    
    // Au lieu d'envoyer deux messages, on modifie le premier (plus propre)
    await sock.sendMessage(from, { 
        text: `🏮 *𝖮𝖳𝖲𝖴𝖳𝖲𝖴𝖪𝖨-𝖲𝖯𝖤𝖤𝖣*\n\n🚀 *Pong !* : ${latence}ms\n🛰️ *Statut* : Stable\n⛩️ *Clan* : Otsutsuki Legacy`,
        edit: msg.key 
    });
};
