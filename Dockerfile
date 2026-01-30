const os = require('os');
const moment = require('moment-timezone');
const config = require('../config');

module.exports = async (sock, m, args) => {
    const time = moment.tz(config.TIMEZONE).format('HH:mm:ss');
    const date = moment.tz(config.TIMEZONE).format('DD/MM/YYYY');
    
    // Calcul de l'uptime (temps de fonctionnement)
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const menuText = `
⛩️ *OTSUTSUKI-MD* ⛩️

*👤 Utilisateur :* @${m.senderNumber}
*📅 Date :* ${date}
*🕒 Heure :* ${time}
*⌛ En ligne :* ${hours}h ${minutes}m ${seconds}s
*🛠️ Préfixe :* [ ${config.PREFIXE} ]
*🌌 Mode :* ${config.MODE}

--- *📜 LISTE DES TECHNIQUES* ---

*💠 COMMANDES ADMIN*
> 🌀 ${config.PREFIXE}kick - Exiler un membre
> 🌀 ${config.PREFIXE}promote - Nommer un admin
> 🌀 ${config.PREFIXE}demote - Destituer un admin
> 🌀 ${config.PREFIXE}tagall - Appel du clan

*💠 COMMANDES GÉNÉRALES*
> 🌀 ${config.PREFIXE}menu - Afficher ce parchemin
> 🌀 ${config.PREFIXE}ping - Vitesse du bot
> 🌀 ${config.PREFIXE}owner - Contacter le créateur

*💠 PROTECTION*
> 🌀 Anti-Link : ${config.ANTILINK ? '✅ Actif' : '❌ Inactif'}

-----------------------------
*POWERED BY OTSUTSUKI-MD*
    `.trim();

    await sock.sendMessage(m.chat, {
        image: { url: config.URL_RECURS }, // Utilise l'URL de secours définie dans ta config
        caption: menuText,
        mentions: [m.sender]
    }, { quoted: m });
};
