module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    // 1. Vérifications de base
    if (!isGroup) return sock.sendMessage(from, { text: "Cette commande ne peut être utilisée que dans un clan (groupe). ❌" });

    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;
    
    // Vérifier si l'utilisateur qui tape la commande est admin
    const isAdmin = participants.find(p => p.id === m.key.participant)?.admin;
    // Vérifier si le bot est admin
    const isBotAdmin = participants.find(p => p.id === (sock.user.id.split(':')[0] + '@s.whatsapp.net'))?.admin;

    if (!isAdmin) return sock.sendMessage(from, { text: "Seul un Administrateur du clan peut nommer de nouveaux chefs. 🏮" });
    if (!isBotAdmin) return sock.sendMessage(from, { text: "Le bot doit être administrateur pour modifier les rangs. ❌" });

    // 2. Identifier la cible (mention ou réponse)
    let target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message.extendedTextMessage?.contextInfo?.participant;

    if (!target) return sock.sendMessage(from, { text: "Veuillez mentionner le Shinobi à promouvoir ou répondre à son message. 👤" });

    try {
        // 3. Exécution de la promotion
        await sock.groupParticipantsUpdate(from, [target], "promote");

        const successMsg = `
╔════════════════════╗
   ⛩️  *PROMOTION DU CLAN* ⛩️
╚════════════════════╝

🏮 *Shinobi :* @${target.split('@')[0]}
🌀 *Nouveau Rang :* Administrateur
📜 *Status :* Autorité confirmée

🌊 _"Un nouveau chef s'élève. Que sa sagesse guide le clan vers la puissance."_

🏮 *OTSUTSUKI-MD SYSTEM* 🏮`;

        await sock.sendMessage(from, { 
            text: successMsg, 
            mentions: [target] 
        });

    } catch (err) {
        console.error("Erreur Promote :", err);
        await sock.sendMessage(from, { text: "Échec de la promotion. Vérifiez mes permissions. ❌" });
    }
};
