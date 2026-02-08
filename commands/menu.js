const config = require('../config');
const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const p = config.PREFIXE || '.';

        // --- ⏱️ DATA SYSTÈME ---
        const date = new Date();
        const time = date.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Brazzaville', hour: '2-digit', minute: '2-digit' });
        
        const start = Date.now();
        const latence = Date.now() - start; 

        const usedRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

        const uptimeSeconds = process.uptime();
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const runtime = `${hours}ʜ ${minutes}ᴍ`;

        const currentMode = (config.MODE === 'public' || config.MODE === 'Public') ? '𝖯𝖴𝖡𝖫𝖨𝖢' : '𝖲𝖤𝖫𝖤';

        // --- 🎨 DESIGN ÉLITE ---
        const menuBody = `
┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    🏮  𝖮𝖳𝖲𝖴𝖳𝖲𝖴𝖪𝖨-𝖬𝖣 : 𝖲𝖸𝖲𝖳𝖤𝖬  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

「 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭𝖲 𝖣𝖴 𝖲𝖧𝖨𝖭𝖮बी 」
👤 𝖭𝗂𝗇𝗃𝖺    : @${sender.split('@')[0]}
🎖️ 𝖱𝖺𝗇𝗀     : ${isOwner ? '𝖪𝖠𝖦𝖤 𝖲𝖴𝖯𝖱𝖤𝖬𝖤' : '𝖦𝖤𝖭𝖨𝖭'}
🌐 𝖬𝗈𝖽𝖾     : ${currentMode}
⚡ 𝖫𝖺𝗍𝖾𝗇𝖼𝖾 : ${latence}𝗆𝗌
📟 𝖢𝗁𝖺𝗄𝗋𝖺   : ${usedRam}𝖬𝖡 / ${totalRam}𝖦𝖡
⏳ 𝖴𝗉𝗍𝗂𝗆𝖾   : ${runtime}
⚔️ 𝖯𝗋𝖾𝖿𝗂𝗑𝖾   : [ ${p} ]

───『 𝖦𝖤𝖲𝖳𝖨𝖮𝖭 𝖣𝖴 𝖢𝖫𝖠𝖭 』───
◈ ${p}mode      : 𝖯𝗎𝖻𝗅𝗂𝖼 / 𝖲𝖾𝗅𝖿
◈ ${p}antilink  : 𝖲𝖼𝖾𝖺𝗎 𝖺𝗇𝗍𝗂-𝗅𝗂𝖾𝗇
◈ ${p}welcome   : 𝖠𝖼𝖼𝗎𝖾𝗂𝗅 𝖽𝗎 𝖢𝗅𝖺𝗇
◈ ${p}goodbye   : 𝖠𝖽𝗂𝖾𝗎 𝖽𝗎 𝖢𝗅𝖺𝗇
◈ ${p}ban / ${p}unban : 𝖯𝗋𝗂𝗌𝗈𝗇𝗇𝗂𝖾𝗋𝗌
◈ ${p}antidelete : 𝖲𝖼𝖾𝖺𝗎 𝖽𝖾 𝗋𝖺𝗉𝗉𝖾𝗅

───『 𝖩𝖴𝖩𝖴𝖳𝖲𝖴𝖲 𝖣𝖤 𝖢𝖮𝖬𝖡𝖠𝖳 』───
◈ ${p}add / ${p}kick : 𝖱𝖾𝖼𝗋𝗎𝗍𝖾𝗋 / 𝖤𝗑𝗂𝗅
◈ ${p}kickall   : 𝖲𝗁𝗂𝗇𝗋𝖺 𝖳𝖾𝗇𝗌𝖾𝗂
◈ ${p}promote   : 𝖭𝗈𝗆𝗆𝖾𝗋 𝖠𝖽𝗆𝗂𝗇
◈ ${p}demote    : 𝖣𝖾𝗌𝗍𝗂𝗍𝗎𝗍𝗂𝗈𝗇
◈ ${p}group     : 𝖮𝗎𝗏𝗋𝗂𝗋 / 𝖥𝖾𝗋𝗆𝖾𝗋
◈ ${p}hidetag   : 𝖠𝗇𝗇𝗈𝗇𝖼𝖾 𝖿𝗎𝗋𝗍𝗂𝗏𝖾
◈ ${p}tagall    : 𝖠𝗉𝖾𝗅 𝖺𝗎𝗑 𝖺𝗋𝗆𝖾𝗌

───『 𝖮𝖬𝖭𝖨𝖲𝖢𝖨𝖤𝖭𝖢𝖤 』───
◈ ${p}ai / ${p}gemini : 𝖮𝗋𝖺𝖼𝗅𝖾 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂
◈ ${p}sticker   : 𝖢𝗋𝖾𝖺𝗍𝗂𝗈𝗇 𝖽𝖾 𝖲𝖼𝖾𝖺𝗎
◈ ${p}tgs       : 𝖲𝖼𝖾𝖺𝗎 𝖺𝗇𝗂𝗆𝖾́
◈ ${p}attp      : 𝖲𝖼𝖾𝖺𝗎 𝖼𝗈𝗅𝗈𝗋𝖾́
◈ ${p}vv        : 𝖵𝗂𝗌𝗂𝗈𝗇 𝖨𝗇𝖿𝗂𝗇𝗂𝖾 (𝖵𝗂𝖾𝗐𝖮𝗇𝖼𝖾)

───『 𝖧𝖠𝖴𝖳 𝖢𝖮𝖭𝖲𝖤𝖨𝖫 』───
◈ ${p}addowner : 𝖠𝗃𝗈𝗎𝗍𝖾𝗋 𝗎𝗇 𝖪𝖺𝗀𝖾
◈ ${p}delowner : 𝖱𝖾𝗍𝗂𝗋𝖾𝗋 𝗎𝗇 𝖪𝖺𝗀𝖾
◈ ${p}clear    : 𝖭𝖾𝗍𝗍𝗈𝗒𝖺𝗀𝖾 𝖳𝖾𝗆𝗉𝗈𝗋𝖾𝗅

───『 𝖲𝖤𝖢𝖱𝖤𝖳𝖲 』───
◈ ${p}owner / ${p}repo / ${p}ping
◈ ${p}ginfo / ${p}infos / ${p}help

 _« Le monde connaîtra enfin_
 _la vraie paix des Otsutsuki. »_

 © 𝟤𝟢𝟤𝟨 𝖲𝖧𝖨𝖭𝖮BI 𝖫𝖤𝖦𝖠𝖢𝖸`;

        // --- 🖼️ GESTION DE L'IMAGE ---
        const localImagePath = path.join(__dirname, '../menu.jpg');
        let finalImage;

        if (fs.existsSync(localImagePath)) {
            // Si menu.jpg existe à la racine, on utilise le buffer local
            finalImage = fs.readFileSync(localImagePath);
        } else {
            // Sinon on utilise l'URL de la config ou l'image par défaut
            finalImage = { url: config.MENU_IMG || 'https://files.catbox.moe/dyox3v.jpg' };
        }

        await sock.sendMessage(from, { 
            image: finalImage, 
            caption: menuBody,
            mentions: [sender],
            contextInfo: {
                externalAdReply: {
                    title: "ＯＴＳＵＴＳＵＫＩ  ＳＥＣＵＲＩＴＹ",
                    body: `📡 Serveur : En ligne [${time}]`,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnail: finalImage, // Utilise la même image pour la vignette
                    sourceUrl: config.GCH || "https://whatsapp.com/channel/0029VbAoFIMA2pL9Tv1omN2K"
                }
            }
        }, { quoted: m });

    } catch (e) {
        console.error("Erreur Menu:", e);
    }
};
