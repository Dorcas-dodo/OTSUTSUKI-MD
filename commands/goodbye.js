module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    if (!isGroup) return sock.sendMessage(from, { text: "Cette commande est réservée aux groupes. ❌" });

    if (!args[0]) return sock.sendMessage(from, { text: "Utilisation : *.goodbye on* ou *.goodbye off*" });

    if (args[0].toLowerCase() === 'on') {
        await sock.sendMessage(from, { text: "🏮 *Système Otsutsuki* : Messages d'exil activés. ✅" });
    } else if (args[0].toLowerCase() === 'off') {
        await sock.sendMessage(from, { text: "🏮 *Système Otsutsuki* : Messages d'exil désactivés. ❌" });
    }
};
