const config = require('../config');

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    // 1. Vérifications de base
    if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: "❌ Cette commande est réservée aux clans." });

    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;
    
    const isBotAdmin = participants.find(p => p.id === (sock.user.id.split(':')[0] + '@s.whatsapp.net'))?.admin;
    const isSenderAdmin = participants.find(p => p.id === sender)?.admin;

    if (!isSenderAdmin) return sock.sendMessage(from, { text: "🏮 Seul un chef de clan peut ordonner une purge totale." });
    if (!isBotAdmin) return sock.sendMessage(from, { text: "⚠️ Je dois être administrateur pour exécuter cette sentence." });

    // 2. Filtrer les membres (on garde les admins et le bot)
    const membersToKick = participants
        .filter(p => !p.admin && p.id !== (sock.user.id.split(':')[0] + '@s.whatsapp.net'))
        .map(p => p.id);

    if (membersToKick.length === 0) return sock.sendMessage(from, { text: "🎐 Aucun membre à expulser, seuls les chefs sont présents." });

    await sock.sendMessage(from, { text: `🔄 *OTSUTSUKI-MD : PURGE ACTIVE*\n\nExécution de ${membersToKick.length} membres en cours... 🌪️` });

    // 3. Exécution Rapide par Batches (5 par 5)
    // Cela permet d'aller 5x plus vite tout en restant "sous le radar" de WhatsApp
    const batchSize = 5;
    for (let i = 0; i < membersToKick.length; i += batchSize) {
        const batch = membersToKick.slice(i, i + batchSize);
        
        try {
            await sock.groupParticipantsUpdate(from, batch, "remove");
            // Délai très court entre les groupes (500ms au lieu de 1000ms par personne)
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
            console.error("Erreur lors de la purge :", err);
        }
    }

    await sock.sendMessage(from, { 
        text: "✅ *PURGE TERMINÉE*\n\nLe clan a été nettoyé. Seuls les dignitaires Otsutsuki subsistent. ⛩️" 
    });
};
