const config = require('../config');
const os = require('os');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const p = config.PREFIXE || '.';

        // --- ⏱️ DATA SYSTÈME PRÉCISE ---
        const date = new Date();
        const time = date.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Brazzaville', hour: '2-digit', minute: '2-digit' });
        
        // Calcul du Ping (Vitesse de réaction)
        const timestamp = Date.now();
        const latence = Date.now() - timestamp; 

        // Calcul de la RAM
        const usedRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

        const uptimeSeconds = process.uptime();
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const runtime = `${hours}ʜ ${minutes}ᴍ`;

        // --- 🎨 DESIGN ÉLITE ---
        const menuBody = `
┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃   🏮  𝖮𝖳𝖲𝖴𝖳𝖲𝖴𝖪𝖨-𝖬𝖣 : 𝖲𝖸𝖲𝖳𝖤𝖬  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

「 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭𝖲 𝖣𝖴 𝖲𝖧𝖨𝖭𝖮𝖡𝖨 」
👤 𝖭𝗂𝗇𝗃𝖺   : @${sender.split('@')[0]}
🎖️ 𝖱𝖺𝗇𝗀    : ${isOwner ? '𝖪𝖠𝖦𝖤 𝖲𝖴𝖯𝖱𝖤𝖬𝖤' : '𝖦𝖤𝖭𝖨𝖭'}
⚡ 𝖫𝖺𝗍𝖾𝗇𝖼𝖾 : ${latence}𝗆𝗌
📟 𝖢𝗁𝖺𝗄𝗋𝖺  : ${usedRam}𝖬𝖡 / ${totalRam}𝖦𝖡
⏳ 𝖴𝗉𝗍𝗂𝗆𝖾  : ${runtime}
⚔️ 𝖯𝗋𝖾𝖿𝗂𝗑𝖾  : [ ${p} ]

───『 𝖦𝖤𝖲𝖳𝖨𝖮𝖭 𝖣𝖴 𝖢𝖫𝖠𝖭 』───
◈ ${p}mode     : 𝖯𝗎𝖻𝗅𝗂𝖼 / 𝖲𝖾𝗅𝖿
◈ ${p}antilink : 𝖲𝖼𝖾𝖺𝗎 𝖺𝗇𝗍𝗂-𝗅𝗂𝖾𝗇
◈ ${p}welcome  : 𝖠𝖼𝖼𝗎𝖾𝗂𝗅 𝖽𝗎 𝖢𝗅𝖺𝗇
◈ ${p}banlist  : 𝖯𝗋𝗂𝗌𝗈𝗇𝗇𝗂𝖾𝗋𝗌

───『 𝖩𝖴𝖳𝖲𝖴𝖲 𝖣𝖤 𝖢𝖮𝖬𝖡𝖠𝖳 』───
◈ ${p}kick     : 𝖤𝗑𝗂𝗅 𝖽𝗂𝗆𝖾𝗇𝗌𝗂𝗈𝗇𝗇𝖾𝗅
◈ ${p}kickall  : 𝖲𝗁𝗂𝗇𝗋𝖺 𝖳𝖾𝗇𝗌𝖾𝗂
◈ ${p}promote  : 𝖭𝗈𝗆𝗆𝖾𝗋 𝖠𝖽𝗆𝗂𝗇
◈ ${p}demote   : 𝖣𝖾𝗌𝗍𝗂𝗍𝗎𝗍𝗂𝗈𝗇
◈ ${p}tagall   : 𝖠𝗉𝗉𝖾𝗅 𝖺𝗎𝗑 𝖺𝗋𝗆𝖾𝗌

───『 𝖮𝖬𝖭𝖨𝖲𝖢𝖨𝖤𝖭𝖢𝖤 』───
◈ ${p}ai / gpt : 𝖮𝗋𝖺𝖼𝗅𝖾 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂
◈ ${p}img      : 𝖢𝗋𝖾𝖺𝗍𝗂𝗈𝗇 𝖵𝗂𝗌𝗎𝖾𝗅𝗅𝖾
◈ ${p}sticker  : 𝖢𝗋𝖾𝖺𝗍𝗂𝗈𝗇 𝖽𝖾 𝖲𝖼𝖾𝖺𝗎
◈ ${p}tr       : 𝖳𝗋𝖺𝖽𝗎𝖼𝗍𝗂𝗈𝗇 𝖴𝗇𝗂𝗏𝖾𝗋𝗌𝖾𝗅

───『 𝖲𝖤𝖢𝖱𝖤𝖳𝖲 』───
◈ ${p}owner / ${p}repo / ${p}ping

 _« Le monde connaîtra enfin_
 _la vraie paix des Otsutsuki. »_

 © 𝟤𝟢𝟤𝟨 𝖲𝖧𝖨𝖭𝖮𝖡𝖨 𝖫𝖤𝖦𝖠𝖢𝖸`;

        const darkImage = config.MENU_IMG || 'https://files.catbox.moe/dyox3v.jpg';

        await sock.sendMessage(from, { 
            image: { url: darkImage }, 
            caption: menuBody,
            mentions: [sender],
            contextInfo: {
                externalAdReply: {
                    title: "ＯＴＳＵＴＳＵＫＩ  ＳＥＣＵＲＩＴＹ",
                    body: `📡 Serveur : En ligne [${time}]`,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnailUrl: darkImage,
                    sourceUrl: config.GCH || "https://whatsapp.com/channel/0029VbAoFIMA2pL9Tv1omN2K"
                }
            }
        }, { quoted: m });

    } catch (e) {
        console.error("Erreur Menu:", e);
    }
};
