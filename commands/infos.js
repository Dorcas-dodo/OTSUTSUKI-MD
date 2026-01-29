const config = require('../config');
const os = require('os');

module.exports = async (sock, m, args) => {
    const uptime = process.uptime();
    const runtime = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
    
    const infoText = `⛩️ *STATUT DU SYSTÈME OTSUTSUKI* ⛩️\n\n` +
                     `👤 *Propriétaire :* ${config.OWNER_NAME}\n` +
                     `🤖 *Bot Name :* ${config.BOT_NAME}\n` +
                     `⏳ *Runtime :* ${runtime}\n` +
                     `📡 *Mode :* ${config.MODE}\n` +
                     `⚙️ *RAM :* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB\n` +
                     `🛡️ *Antilink :* ${config.ANTILINK === "true" ? "Actif ✅" : "Inactif ❌"}`;

    await sock.sendMessage(m.key.remoteJid, { text: infoText }, { quoted: m });
};
