module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    // 1. Vérification si on est en groupe
    if (!isGroup) return sock.sendMessage(from, { text: "Cette commande est réservée aux clans ! ❌" });

    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;
    
    // Vérifier si l'utilisateur est admin
    const isAdmin = participants.find(p => p.id === m.key.participant)?.admin;
    if (!isAdmin) return sock.sendMessage(from, { text: "Seul un chef de clan peut lancer un appel général. 🏮" });

    // 2. Récupération du message à envoyer
    // Si pas de texte après .hidetag, on met un message par défaut
    const message = args.join(" ") || "Annonce importante du Grand Maître Otsutsuki ! ⛩️";

    // 3. Envoi du message avec mention de TOUS les participants (invisible)
    await sock.sendMessage(from, { 
        text: message, 
        mentions: participants.map(a => a.id) 
    });
};
