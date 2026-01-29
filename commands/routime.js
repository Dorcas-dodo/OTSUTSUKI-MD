module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;

    /**
     * Calcule le temps écoulé depuis le démarrage du processus
     * @param {number} seconds 
     * @returns {string} Temps formaté
     */
    function runtime(seconds) {
        seconds = Number(seconds);
        var d = Math.floor(seconds / (3600 * 24));
        var h = Math.floor(seconds % (3600 * 24) / 3600);
        var m = Math.floor(seconds % 3600 / 60);
        var s = Math.floor(seconds % 60);
        
        var dDisplay = d > 0 ? d + (d == 1 ? " jour, " : " jours, ") : "";
        var hDisplay = h > 0 ? h + (h == 1 ? " heure, " : " heures, ") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " seconde" : " secondes") : "";
        return dDisplay + hDisplay + mDisplay + sDisplay;
    }

    const uptime = runtime(process.uptime());

    const runtimeMsg = `
╔════════════════════╗
   ⛩️  *STATUT SYSTÈME* ⛩️
╚════════════════════╝

⌛ *Activité :* ${uptime}
🌀 *Moteur :* Otsutsuki-MD V1
📡 *Serveur :* Stable
⚡ *Latence :* Rapide

🌊 _"L'immortalité n'est qu'une question de maintenance. Le clan reste actif."_

🏮 *OTSUTSUKI-MD SYSTEM* 🏮`;

    await sock.sendMessage(from, {
        image: { url: 'https://raw.githubusercontent.com/Dorcas-dodo/OTSUTSUKI-MD/master/media/menu.jpg' },
        caption: runtimeMsg
    }, { quoted: m });
};
