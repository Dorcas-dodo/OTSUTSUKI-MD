const config = require('../config');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        
        // --- 🔎 RECONNAISSANCE MAÎTRE ---
        const cleanSender = sender.split('@')[0]; 
        const cleanOwner = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : '';
        const isOwner = m.key.fromMe || cleanSender === cleanOwner || cleanSender === '242066969267';

        // --- 🏆 CLASSEMENT OTSUTSUKI ---
        const otsutsukiClan = [
            { name: "Hagoromo", symbol: "☀️" },
            { name: "Indra", symbol: "⚡" },
            { name: "Isshiki", symbol: "🔥" },
            { name: "Kaguya", symbol: "🌀" },
            { name: "Momoshiki", symbol: "💎" }
        ];
        const dailyProtector = otsutsukiClan[Math.floor(Math.random() * otsutsukiClan.length)];

        // --- ⏱️ CALCUL TEMPS ET UPTIME (SANS MOMENT) ---
        const date = new Date();
        const time = date.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Brazzaville', hour: '2-digit', minute: '2-digit' });
        const uptimeSeconds = process.uptime();
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const runtime = `${hours}h ${minutes}m`;

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
   │ ◦ ${config.PREFIXE}ping • _Vitesse_
   
   *🧬「 KEKKEI MŌRA (POUVOIRS) 」*
   │ ◦ ${config.PREFIXE}ai • _Sagesse_
   │ ◦ ${config.PREFIXE}vv • _Vision_
   │ ◦ ${config.PREFIXE}sticker • _Sceau_

   🕯️ _"La volonté du clan ne meurt jamais."_

   📍 *Dimension Otsutsuki | Brazzaville*
   ⏰ *Heure :* ${time}`;

        // --- ENVOI INTELLIGENT ET SÉCURISÉ ---
        const menuImage = config.MENU_IMG || 'https://telegra.ph/file/0c9269550e68d011f0165.jpg';

        try {
            await sock.sendMessage(from, { 
                image: { url: menuImage }, 
                caption: texteMenu,
                mentions: [sender],
                contextInfo: {
                    externalAdReply: {
                        title: "ＯＴＳＵＴＳＵＫＩ ＳＹＳＴＥＭ",
                        body: isOwner ? "Maître reconnu ✅" : "Shinobi identifié 👤",
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        thumbnailUrl: menuImage,
                        sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                    }
                }
            }, { quoted: m });
        } catch (imgError) {
            // Secours texte pur si l'image crash
            console.log("⚠️ Problème d'image, envoi du texte seul.");
            await sock.sendMessage(from, { text: texteMenu, mentions: [sender] }, { quoted: m });
        }

    } catch (e) {
        console.error("❌ Erreur critique Menu :", e);
    }
};
