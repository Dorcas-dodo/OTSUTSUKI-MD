const config = require('../config');
const moment = require('moment-timezone');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        
        // --- DATA RAPIDE ---
        const time = moment.tz('Africa/Brazzaville').format('HH:mm:ss');
        const date = moment.tz('Africa/Brazzaville').format('DD/MM/YYYY');
        const uptime = process.uptime();
        const runtime = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;

        const texteMenu = `✨ *✧━━『 ⛩️ OTSUTSUKI-MD ⛩️ 』━━✧* ✨

💠 *S Y S T È M E  D ' É V E I L* 💠

  👤 *HÔTE :* @${sender.split('@')[0]}
  🧬 *CLAN :* ${config.OWNER_NAME}
  ⏱️ *ÉVEIL :* ${runtime}
  🏮 *PRÉFIXE :* « ${config.PREFIXE} »
  📍 *HEURE :* ${time}

*┏━━〔 📜 ARCHIVES DU CLAN 〕━━┓*

  *⛩️ MAÎTRISE GÉNÉRALE*
  │ ◦ PING • INFOS • TEST
  │ ◦ RUNTIME • SPEED
  
  *⚔️ DISCIPLINE ADMIN*
  │ ◦ KICK • ADD • GROUP
  │ ◦ PROMOTE • DEMOTE • TAGALL
  
  *🛡️ BARRIÈRE DE SÉCURITÉ*
  │ ◦ ANTILINK • BAN • CLEAR
  │ ◦ WARN • UNBAN
  
  *🧬 ART DU NINJUTSU*
  │ ◦ AI • VV • STICKER
  │ ◦ EDIT • ATTP • TRAD
  
  *👁️‍🗨️ POUVOIR SUPRÊME*
  │ ◦ MODE • SETPREFIX • EVAL
  │ ◦ REBOOT • SHUTDOWN

*┗━━━━━━━━━━━━━━━━━━━━┛*

  🌑 _"Tout ce qui est sous le ciel_
  _appartient au clan Otsutsuki."_

*© 2026 OTSUTSUKI LEGACY*`;

        // --- ENVOI HAUTE PERFORMANCE ---
        
        await sock.sendMessage(from, { 
            image: { url: config.MENU_IMG }, 
            caption: texteMenu,
            mentions: [sender],
            contextInfo: {
                externalAdReply: {
                    title: "ＯＴＳＵＴＳＵＫＩ  ＭＥＮＵ",
                    body: `Statut: Connecté 🟢`,
                    mediaType: 1,
                    renderLargerThumbnail: true, // On le laisse car c'est plus stylé
                    thumbnailUrl: config.MENU_IMG,
                    sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                }
            }
        }, { quoted: m });

        // Audio asynchrone (ne ralentit pas l'affichage)
        sock.sendMessage(from, { 
            audio: { url: './media/menu.mp3' }, 
            mimetype: 'audio/mp4', 
            ptt: true 
        }).catch(() => {});

    } catch (e) {
        console.error("Erreur Menu :", e);
    }
};
