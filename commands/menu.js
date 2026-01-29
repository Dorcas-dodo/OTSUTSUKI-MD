const config = require('../config');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        
        // --- 🔎 LOGIQUE DE RECONNAISSANCE ABSOLUE ---
        const cleanSender = sender.split('@')[0]; 
        const cleanOwner = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : '';
        
        // RECONNAISSANCE : Bot lui-même OU numéro config OU ton numéro fixe
        const isOwner = m.key.fromMe || 
                        cleanSender === cleanOwner || 
                        cleanSender === '242066969267';

        // --- 🏆 CLASSEMENT OTSUTSUKI ---
        const otsutsukiClan = [
            { name: "Hagoromo", symbol: "☀️" },
            { name: "Indra", symbol: "⚡" },
            { name: "Isshiki", symbol: "🔥" },
            { name: "Kaguya", symbol: "🌀" }
        ];
        const dailyProtector = otsutsukiClan[Math.floor(Math.random() * otsutsukiClan.length)];

        // Temps et Uptime simplifiés pour éviter les crashs de librairies
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

   🕯️ _"La volonté du clan ne meurt jamais."_

   📍 *Dimension Otsutsuki*`;

        // --- ENVOI HAUTE SÉCURITÉ ---
        try {
            // Tentative d'envoi avec image
            await sock.sendMessage(from, { 
                image: { url: config.MENU_IMG || 'https://telegra.ph/file/0c9269550e68d011f0165.jpg' }, 
                caption: texteMenu,
                mentions: [sender],
                contextInfo: {
                    externalAdReply: {
                        title: "ＯＴＳＵＴＳＵＫＩ ＳＹＳＴＥＭ",
                        body: isOwner ? "Maître reconnu ✅" : "Shinobi identifié 👤",
                        mediaType: 1,
                        renderLargerThumbnail: false,
                        thumbnailUrl: config.MENU_IMG || 'https://telegra.ph/file/0c9269550e68d011f0165.jpg'
                    }
                }
            }, { quoted: m });
        } catch (imgError) {
            // Secours texte si l'image ou l'adReply bug
            console.log("Erreur image, basculement en mode texte...");
            await sock.sendMessage(from, { text: texteMenu, mentions: [sender] }, { quoted: m });
        }

    } catch (e) {
        console.error("Erreur critique Menu :", e);
        // Ultime recours : message direct à l'expéditeur
        try {
            await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Chakra instable. Erreur : " + e.message });
        } catch (fatal) {
            console.log("Crash total du bot.");
        }
    }
};
