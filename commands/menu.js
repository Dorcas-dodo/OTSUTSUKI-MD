const config = require('../config');
const moment = require('moment-timezone');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        
        // --- 🔎 LOGIQUE DE RECONNAISSANCE DU MAÎTRE ---
        const cleanSender = sender.split('@')[0]; // Numéro de celui qui écrit
        const cleanOwner = config.NUMERO_OWNER.replace(/[^0-9]/g, ''); // Ton numéro perso nettoyé
        
        // Le Maître est soit celui qui a scanné (fromMe), soit ton numéro perso (cleanOwner)
        const isOwner = m.key.fromMe || cleanSender === cleanOwner;
        
        // --- 🏆 CLASSEMENT OTSUTSUKI ---
        const otsutsukiClan = [
            { name: "Hagoromo", symbol: "☀️", power: "Sage des Six Chemins" },
            { name: "Indra", symbol: "⚡", power: "Génie du Ninjutsu" },
            { name: "Isshiki", symbol: "🔥", power: "Souverain des Dimensions" },
            { name: "Kaguya", symbol: "🌀", power: "Mère Primordiale" }
        ];

        const dailyProtector = otsutsukiClan[Math.floor(Math.random() * otsutsukiClan.length)];

        const time = moment.tz('Africa/Brazzaville').format('HH:mm');
        const runtime = `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`;

        const texteMenu = `
✨ *『 HIÉRARCHIE DE LA LIGNÉE DIVINE 』* ✨

   👁️‍🗨️  *ＯＴＳＵＴＳＵＫＩ - ＬＥＧＡＣＹ* 👁️‍🗨️
   
   *┏━━━━━━━━━━━━━━━━━━━━┓*
     🏮 *HÔTE :* @${cleanSender}
     👑 *RANG :* ${isOwner ? "🌙 Dieux Otsutsuki" : "🍃 Shinobi du Village"}
     ⏳ *ENDURANCE :* ${runtime}
     🛡️ *GARDE :* ${dailyProtector.symbol} ${dailyProtector.name}
   *┗━━━━━━━━━━━━━━━━━━━━┛*

   *📜「 ROULEAUX DE TRANSMISSION 」*
   │ ◦ ${config.PREFIXE}ping • _Vitesse Divine_
   │ ◦ ${config.PREFIXE}infos • _Archives Interdites_
   │ ◦ ${config.PREFIXE}speed • _Flux de Chakra_
   
   *⚔️「 DROIT DE VIE OU DE MORT (ADMIN) 」*
   │ ◦ kick • _Exil Dimensionnel_
   │ ◦ kickall • _Purge Totale_
   │ ◦ promote • _Élever au Clan_
   │ ◦ demote • _Destitution_
   
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
                    body: isOwner ? "Maître reconnu ✅" : "Shinobi identifié 👤",
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
