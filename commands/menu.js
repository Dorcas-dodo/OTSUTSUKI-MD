const config = require('../config');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const p = config.PREFIXE || '.';

        // --- ⏱️ DATA SYSTÈME ---
        const date = new Date();
        const options = { timeZone: 'Africa/Brazzaville', hour: '2-digit', minute: '2-digit' };
        const time = date.toLocaleTimeString('fr-FR', options);
        
        const uptimeSeconds = process.uptime();
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const runtime = `${hours}ʜ ${minutes}ᴍ`;

        // --- 🎨 DESIGN MONOSPACE DARK ---
        const menuBody = `
┌──────────────────────────┐
  🏮 𝖮𝖳𝖲𝖴𝖳𝖲𝖴𝖪𝖨-𝖬𝖣 : 𝖲𝖸𝖲𝖳𝖤𝖬  
└──────────────────────────┘

｢ 𝖣𝖮𝖲𝖲𝖨𝖤𝖱 𝖢𝖮𝖭𝖥𝖨𝖣𝖤𝖭𝖳𝖨𝖤𝖫 ｣
👤 𝖭𝗂𝗇𝗃𝖺   : @${sender.split('@')[0]}
🎖️ 𝖱𝖺𝗇𝗀    : ${isOwner ? '𝖪𝖠𝖦𝖤 𝖲𝖴𝖯𝖱𝖤𝖬𝖤' : '𝖦𝖤𝖭𝖨𝖭'}
⏳ 𝖴𝗉𝗍𝗂𝗆𝖾  : ${runtime}
⚔️ 𝖯𝗋𝖾𝖿𝗂𝗑𝖾  : [ ${p} ]
🗺️ 𝖫𝗂𝖾𝗎    : 𝖡𝗋𝖺𝗓𝗓𝖺𝗏𝗂𝗅𝗅𝖾

───『 𝖦𝖤𝖲𝖳𝖨𝖮𝖭 𝖣𝖴 𝖢𝖫𝖠𝖭 』───
◈ ${p}addowner : 𝖮𝖼𝗍𝗋𝗈𝗒𝖾𝗋 𝗅𝖾 𝖢𝗁𝖺𝗄𝗋𝖺
◈ ${p}delowner : 𝖱𝖾𝗍𝗂𝗋𝖾𝗋 𝗅𝖾 𝖢𝗁𝖺𝗄𝗋𝖺
◈ ${p}mode     : 𝖯𝗎𝖻𝗅𝗂𝖼 / 𝖲𝖾𝗅𝖿
◈ ${p}antilink : 𝖲𝖼𝖾𝖺𝗎 𝖺𝗇𝗍𝗂-𝗅𝗂𝖾𝗇
◈ ${p}welcome  : 𝖠𝖼𝖼𝗎𝖾𝗂𝗅 𝖽𝗎 𝖢𝗅𝖺𝗇

───『 𝖩𝖴𝖳𝖲𝖴𝖲 𝖣𝖤 𝖢𝖮𝖬𝖡𝖠𝖳 』───
◈ ${p}kick     : 𝖤𝗑𝗂𝗅 𝖽𝗂𝗆𝖾𝗇𝗌𝗂𝗈𝗇𝗇𝖾𝗅
◈ ${p}kickall  : 𝖲𝗁𝗂𝗇𝗋𝖺 𝖳𝖾𝗇𝗌𝖾𝗂
◈ ${p}ban      : 𝖡𝖺𝗇𝗇𝗂𝗌𝗌𝖾𝗆𝖾𝗇𝗍
◈ ${p}promote  : 𝖭𝗈𝗆𝗆𝖾𝗋 𝖠𝖽𝗆𝗂𝗇
◈ ${p}add      : 𝖨𝗇𝗏𝗈𝖼𝖺𝗍𝗂𝗈𝗇 (𝖪𝗎𝖼𝗁𝗂𝗒𝗈𝗌𝖾)
◈ ${p}tagall   : 𝖠𝗉𝗉𝖾𝗅 𝖺𝗎𝗑 𝖺𝗋𝗆𝖾𝗌

───『 𝖮𝖬𝖭𝖨𝖲𝖢𝖨𝖤𝖭𝖢𝖤 』───
◈ ${p}ai / ${p}gpt : 𝖮𝗋𝖺𝖼𝗅𝖾 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂
◈ ${p}vv       : 𝖮𝖾𝗂𝗅 𝖽𝗎 𝖱𝗂𝗇𝗇𝖾𝗀𝖺𝗇
◈ ${p}sticker  : 𝖢𝗋𝖾𝖺𝗍𝗂𝗈𝗇 𝖽𝖾 𝖲𝖼𝖾𝖺𝗎

───『 𝖲𝖤𝖢𝖱𝖤𝖳𝖲 』───
◈ ${p}infos / ${p}owner
◈ ${p}help / ${p}repo

  「 𝖣𝖤𝖢𝖫𝖠𝖱𝖠𝖳𝖨𝖮𝖭 」
  _« Le monde connaîtra enfin_
    _la vraie paix des Otsutsuki. »_

  © 𝟤𝟢𝟤𝟨 𝖲𝖧𝖨𝖭𝖮𝖡𝖨 𝖫𝖤𝖦𝖠𝖢𝖸`;

        const darkImage = config.MENU_IMG || 'https://telegra.ph/file/0c9269550e68d011f0165.jpg';

        await sock.sendMessage(from, { 
            image: { url: darkImage }, 
            caption: menuBody,
            mentions: [sender],
            contextInfo: {
                externalAdReply: {
                    title: "ＯＴＳＵＴＳＵＫＩ   ＳＥＣＵＲＩＴＹ",
                    body: "Statut : " + time,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnailUrl: darkImage,
                    sourceUrl: " "
                }
            }
        }, { quoted: m });

    } catch (e) {
        console.error(e);
    }
};
