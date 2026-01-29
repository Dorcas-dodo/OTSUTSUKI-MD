const config = require('../config');
const moment = require('moment-timezone');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        
        // --- LOGIQUE DE CLASSEMENT OTSUTSUKI (MISE À JOUR) ---
        const otsutsukiClan = [
            { name: "Hagoromo", power: "Sage des Six Chemins" },
            { name: "Indra", power: "Génie du Ninjutsu" },
            { name: "Isshiki", power: "Souverain des Dimensions" },
            { name: "Kaguya", power: "Mère Primordiale" }
        ];

        // Protecteur du jour choisi parmi la lignée
        const dailyProtector = otsutsukiClan[Math.floor(Math.random() * otsutsukiClan.length)];

        const time = moment.tz('Africa/Brazzaville').format('HH:mm');
        const runtime = `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`;

        const texteMenu = `
✨ *『 HIÉRARCHIE DE LA LIGNÉE DIVINE 』* ✨

   👁️‍🗨️  *ＯＴＳＵＴＳＵＫＩ - ＬＥＧＡＣＹ* 👁️‍🗨️
   
   *┏━━━━━━━━━━━━━━━━━━━━┓*
     🏮 *HÔTE :* @${sender.split('@')[0]}
     👑 *RANG :* Élite du Clan Supérieur
     ⏳ *ENDURANCE :* ${runtime}
     🛡️ *GARDE :* ${dailyProtector.name}
   *┗━━━━━━━━━━━━━━━━━━━━┛*

   *📜「 ROULEAUX DE TRANSMISSION 」*
   │ ◦ ${config.PREFIXE}ping • _Vitesse Divine_
   │ ◦ ${config.PREFIXE}infos • _Archives Interdites_
   │ ◦ ${config.PREFIXE}speed • _Flux de Chakra_
   
   *⚔️「 DROIT DE VIE OU DE MORT (ADMIN) 」*
   │ ◦ kick • _Exil Dimensionnel_
   │ ◦ add • _Appel au Clan_
   │ ◦ group • _Sceau de Zone_
   │ ◦ tagall • _Éveil des Shinobis_
   
   *🛡️「 BARRIÈRE DES SIX CHEMINS 」*
   │ ◦ antilink • _Anti-Espionnage_
   │ ◦ ban • _Prison du Néant_
   │ ◦ clear • _Purge du Monde_
   │ ◦ warn • _Jugement Divin_
   
   *🧬「 KEKKEI MŌRA (POUVOIRS) 」*
   │ ◦ ai • _Sagesse de Hagoromo_
   │ ◦ vv • _Rinne-Sharingan_
   │ ◦ sticker • _Sceau de Karma_
   │ ◦ edit • _Réécriture Réelle_
   
   *🪐「 CONSEIL DES OTSUTSUKI 」*
   │ ◦ mode • _Loi du Monde_
   │ ◦ setprefix • _Code d'Élite_
   │ ◦ reboot • _Renaissance_
   │ ◦ eval • _Volonté Divine_

   *┏━━〔 🏆 CLASSEMENT DE PUISSANCE 〕━━┓*
     1. ☀️ *HAGOROMO* (Le Fondateur)
     2. ⚡ *INDRA* (L'Héritier de l'Art)
     3. 🔥 *ISSHIKI* (La Force Pure)
     4. 🌀 *KAGUYA* (L'Origine du Tout)
   *┗━━━━━━━━━━━━━━━━━━━━┛*

   🕯️ _"La volonté du clan ne meurt jamais,_
   _elle se transmet par le Karma."_

   📍 *Dimension Otsutsuki | ${time}*`;

        // --- ENVOI HAUTE PERFORMANCE ---
        
        await sock.sendMessage(from, { 
            image: { url: config.MENU_IMG }, 
            caption: texteMenu,
            mentions: [sender],
            contextInfo: {
                externalAdReply: {
                    title: "ＯＴＳＵＴＳＵＫＩ   ＰＲＯＪＥＣＴ",
                    body: "Technique de Suprématie activée 🔴",
                    mediaType: 1,
                    renderLargerThumbnail: true, 
                    thumbnailUrl: config.MENU_IMG,
                    sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                }
            }
        }, { quoted: m });

    } catch (e) {
        console.error("Erreur Otsutsuki Menu :", e);
    }
};
