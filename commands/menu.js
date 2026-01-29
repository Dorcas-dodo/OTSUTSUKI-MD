const config = require('../config');

const moment = require('moment-timezone');



module.exports = async (sock, m, args) => {

    try {

        const from = m.key.remoteJid;

        // Détection de l'expéditeur : gère les groupes et le chat privé

        const sender = m.key.participant || m.key.remoteJid;

        

        // --- 🔎 LOGIQUE DE RECONNAISSANCE ABSOLUE ---

        const cleanSender = sender.split('@')[0]; 

        const cleanOwner = config.NUMERO_OWNER ? config.NUMERO_OWNER.replace(/[^0-9]/g, '') : '';

        

        // On force la reconnaissance si c'est TOI (242066969267) ou le bot lui-même

        const isOwner = m.key.fromMe || cleanSender === cleanOwner || cleanSender === '242066969267';

        

        // --- 🏆 CLASSEMENT OTSUTSUKI ---

        const otsutsukiClan = [

            { name: "Hagoromo", symbol: "☀️" },

            { name: "Indra", symbol: "⚡" },

            { name: "Isshiki", symbol: "🔥" },

            { name: "Kaguya", symbol: "🌀" }

        ];

        const dailyProtector = otsutsukiClan[Math.floor(Math.random() * otsutsukiClan.length)];



        const time = moment.tz('Africa/Brazzaville').format('HH:mm');

        const runtime = `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`;



        const texteMenu = `✨ *『 RÉSIDENCE DES OTSUTSUKI 』* ✨



   👁️‍🗨️ *ＯＴＳＵＴＳＵＫＩ - ＬＥＧＡＣＹ* 👁️‍🗨️

   

   *┏━━━━━━━━━━━━━━━━━━━━┓*

     🏮 *HÔTE :* @${cleanSender}

     👑 *RANG :* ${isOwner ? "🌙 Dieux Otsutsuki" : "🍃 Shinobi du Village"}

     ⏳ *ENDURANCE :* ${runtime}

     🛡️ *GARDE :* ${dailyProtector.symbol} ${dailyProtector.name}

   *┗━━━━━━━━━━━━━━━━━━━━┛*



   *📜「 MISSIONS RANG A (ADMIN) 」*

   │ ◦ ${config.PREFIXE}kick • _Exil_

   │ ◦ ${config.PREFIXE}kickall • _Purge_

   │ ◦ ${config.PREFIXE}mode • _Flux_

   

   *🧬「 KEKKEI MŌRA (POUVOIRS) 」*

   │ ◦ ${config.PREFIXE}ai • _Sagesse_

   │ ◦ ${config.PREFIXE}vv • _Vision_

   │ ◦ ${config.PREFIXE}sticker • _Sceau_



   🕯️ _"La volonté du clan ne meurt jamais,_

   _elle se transmet par le Karma."_



   📍 *Brazzaville, CG | ${time}*`;



        // --- ENVOI ULTRA-RAPIDE ---

        await sock.sendMessage(from, { 

            image: { url: config.MENU_IMG || 'https://telegra.ph/file/0c9269550e68d011f0165.jpg' }, 

            caption: texteMenu,

            mentions: [sender],

            contextInfo: {

                externalAdReply: {

                    title: "ＯＴＳＵＴＳＵＫＩ ＳＹＳＴＥＭ",

                    body: isOwner ? "Maître reconnu ✅" : "Shinobi identifié 👤",

                    mediaType: 1,

                    renderLargerThumbnail: false, // FALSE pour éviter le lag

                    thumbnailUrl: config.MENU_IMG

                }

            }

        }, { quoted: m });



    } catch (e) {

        console.error("Erreur Menu :", e);

        // Secours texte si l'image crash

        sock.sendMessage(m.key.remoteJid, { text: "❌ Erreur critique dans les archives." });

    }

};
