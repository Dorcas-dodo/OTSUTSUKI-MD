module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    // Vérification si on est dans un groupe
    if (!isGroup) return sock.sendMessage(from, { text: "Cette commande est réservée aux groupes. ❌" });

    if (!args[0]) return sock.sendMessage(from, { text: "Utilisation : *.welcome on* ou *.welcome off*" });

    if (args[0].toLowerCase() === 'on') {
        // Note : Pour que cela soit permanent, il faudrait modifier le fichier config.js ou une DB
        await sock.sendMessage(from, { text: "🏮 *Système Otsutsuki* : Messages de bienvenue activés pour ce clan. ✅" });
    } else if (args[0].toLowerCase() === 'off') {
        await sock.sendMessage(from, { text: "🏮 *Système Otsutsuki* : Messages de bienvenue désactivés. ❌" });
    }
};
