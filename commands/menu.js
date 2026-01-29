const config = require('../config');
const moment = require('moment-timezone');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        
        // --- CALCUL DU RANG NINJA ---
        const hour = moment.tz('Africa/Brazzaville').hour();
        const isOwner = sender.includes(config.OWNER_NUMBER);
        let ninjaRank = isOwner ? "🌙 Dieux Otsutsuki" : "🍃 Shinobi du Village";
        
        // --- SALUTATION SHINOBI ---
        let greeting = "Repos nocturne";
        if (hour >= 5 && hour < 12) greeting = "Entraînement matinal";
        else if (hour >= 12 && hour < 18) greeting = "Mission de jour";
        else if (hour >= 18 && hour < 23) greeting = "Garde de nuit";

        const time = moment.tz('Africa/Brazzaville').format('HH:mm');
        const uptime = process.uptime();
        const runtime = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;

        const texteMenu = `
✨ *『 PAIX SUR LE MONDE SHINOBI 』* ✨

   👁️‍🗨️  *ＯＴＳＵＴＳＵＫＩ - ＬＥＧＡＣＹ* 👁️‍🗨️
   
   *┏━━━━━━━━━━━━━━━━━━━━┓*
     🏮 *HÔTE :* @${sender.split('@')[0]}
     📜 *RANG :* ${ninjaRank}
     ⌛ *CHAKRA :* ${runtime} restant
     🌀 *FLUX :* ${greeting}
   *┗━━━━━━━━━━━━━━━━━━━━┛*

   *📜「 ROULEAUX DE BASE 」*
   │ ◦ ${config.PREFIXE}ping • _Vitesse_
   │ ◦ ${config.PREFIXE}infos • _Archives_
   │ ◦ ${config.PREFIXE}runtime • _Endurance_
   
   *⚔️「 MISSIONS DE RANG A (ADMIN) 」*
   │ ◦ kick • _Exil du clan_
   │ ◦ add • _Recrutement_
   │ ◦ group • _Sceau du groupe_
   │ ◦ tagall • _Rassemblement_
   
   *🛡️「 BARRIÈRE DE PROTECTION 」*
   │ ◦ antilink • _Contre-espionnage_
   │ ◦ ban • _Prison dimensionnelle_
   │ ◦ clear • _Purge de zone_
   │ ◦ warn • _Avertissement_
   
   *🧬「 KEKKEI GENKAI (ART) 」*
   │ ◦ ai • _Sagesse éternelle_
   │ ◦ vv • _Vision nocturne_
   │ ◦ sticker • _Parchemin scellé_
   │ ◦ edit • _Métamorphose_
   
   *🪐「 POUVOIR DES SIX CHEMINS 」*
   │ ◦ mode • _État du monde_
   │ ◦ setprefix • _Code secret_
   │ ◦ reboot • _Renaissance_
   │ ◦ eval • _Création divine_

   *┏━━━━━━━━━━━━━━━━━━━━┓*
      🕯️ _"Celui qui ne comprend pas_
      _la douleur ne peut pas_
      _connaître la vraie paix."_
   *┗━━━━━━━━━━━━━━━━━━━━┛*

   📍 *Village de Brazzaville | ${time}*`;

        // --- ENVOI DE LA MISSION ---
        
        await sock.sendMessage(from, { 
            image: { url: config.MENU_IMG }, 
            caption: texteMenu,
            mentions: [sender],
            contextInfo: {
                externalAdReply: {
                    title: "O T S U T S U K I   P R O J E C T",
                    body: "Technique de l'Œil Divin activée",
                    mediaType: 1,
                    renderLargerThumbnail: true, 
                    thumbnailUrl: config.MENU_IMG,
                    sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                }
            }
        }, { quoted: m });

        // L'audio s'exécute en fond pour l'immersion
        sock.sendMessage(from, { 
            audio: { url: './media/menu.mp3' }, 
            mimetype: 'audio/mp4', 
            ptt: true 
        }).catch(() => {});

    } catch (e) {
        console.error("Erreur Shinobi Menu :", e);
    }
};
