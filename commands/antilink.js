module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    if (!isGroup) return sock.sendMessage(from, { text: "Cette commande est réservée aux groupes ! ❌" });

    // Seul un admin peut configurer l'antilink
    const groupMetadata = await sock.groupMetadata(from);
    const isAdmin = groupMetadata.participants.find(p => p.id === m.key.participant)?.admin;
    if (!isAdmin) return sock.sendMessage(from, { text: "Désolé, seuls les admins du clan peuvent configurer l'Antilink. 🏮" });

    if (!args[0]) return sock.sendMessage(from, { text: "Utilisation : *.antilink on* ou *.antilink off*" });

    if (args[0].toLowerCase() === 'on') {
        await sock.sendMessage(from, { text: "✅ *Antilink activé* : Tout Shinobi envoyant un lien sera banni du clan immédiatement !" });
    } else if (args[0].toLowerCase() === 'off') {
        await sock.sendMessage(from, { text: "❌ *Antilink désactivé* : Les liens sont désormais autorisés dans ce groupe." });
    }
};
