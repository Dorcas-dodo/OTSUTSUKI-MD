const config = require('../config');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        
        // --- 🔎 IDENTIFICATION ---
        const cleanSender = sender.split('@')[0];
        const cleanOwner = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : '';
        const isOwner = m.key.fromMe || cleanSender === cleanOwner || cleanSender === '242066969267';

        // --- ⏱️ DATA & UPTIME (LOGIQUE NATIVE SANS MOMENT) ---
        const date = new Date();
        const options = { timeZone: 'Africa/Brazzaville', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const time = date.toLocaleTimeString('fr-FR', options);
        
        const uptimeSeconds = process.uptime();
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const runtime = `${hours}h ${minutes}m`;
        
        const p = config.PREFIXE || '.';

        // --- 🎨 DESIGN DARK MODE ---
        const header = `╔═══ 🌕 *ＯＴＳＵＴＳＵＫＩ* 🌕 ═══╗`;
        const footer = `╚═══════════════════════╝`;

        const texteMenu = `${header}
║ 
║ 👤 *HÔTE* : @${cleanSender}
║ 👑 *RANG* : ${isOwner ? 'ᴅɪᴇᴜ ᴏᴛsᴜᴛsᴜᴋɪ' : 'sʜɪɴᴏʙɪ'}
║ ⏳ *ᴜᴘᴛɪᴍᴇ* : ${runtime}
║ 🏮 *ᴘʀᴇғɪxᴇ* : [ ${p} ]
║ 📍 *ʟɪᴇᴜ* : ʙʀᴀᴢᴢᴀᴠɪʟʟᴇ
║
╠═══『 🛠️ *ɢᴇsᴛɪᴏɴ* 』═══
║ ◦ ${p}ᴍᴏᴅᴇ [ᴘᴜʙʟɪᴄ/sᴇʟғ]
║ ◦ ${p}ᴀɴᴛɪʟɪɴᴋ [ᴏɴ/ᴏғғ]
║ ◦ ${p}ᴡᴇʟᴄᴏᴍᴇ / ${p}ɢᴏᴏᴅʙʏᴇ
║ ◦ ${p}ᴘɪɴɢ / ${p}ʀᴏᴜᴛɪᴍᴇ
║
╠═══『 ⚔️ *ᴀᴅᴍɪɴɪsᴛʀᴀᴛɪᴏɴ* 』═══
║ ◦ ${p}ᴋɪᴄᴋ / ${p}ᴋɪᴄᴋᴀʟʟ
║ ◦ ${p}ʙᴀɴ / ${p}ᴘʀᴏᴍᴏᴛᴇ
║ ◦ ${p}ᴛᴀɢᴀʟʟ / ${p}ʜɪᴅᴇᴛᴀɢ
║ ◦ ${p}ɢʀᴏᴜᴘ [ᴏᴘᴇɴ/ᴄʟᴏsᴇ]
║ ◦ ${p}ᴄʟᴇᴀʀ / ${p}ᴀᴅᴅ
║
╠═══『 🧬 *ᴋᴇᴋᴋᴇɪ ᴍᴏʀᴀ* 』═══
║ ◦ ${p}ᴀɪ [ǫᴜᴇsᴛɪᴏɴ]
║ ◦ ${p}ᴠᴠ [ᴠɪᴇᴡ-ᴏɴᴄᴇ]
║ ◦ ${p}sᴛɪᴄᴋᴇʀ / ${p}ᴀᴛᴛᴘ
║ ◦ ${p}ᴛɢs / ${p}ᴀɴᴛɪᴅᴇʟᴇᴛᴇ
║
╠═══『 📜 *ᴀʀᴄʜɪᴠᴇs* 』═══
║ ◦ ${p}ɪɴғᴏs / ${p}ɢɪɴғᴏ
║ ◦ ${p}ᴏᴡɴᴇʀ / ${p}ʜᴇʟᴘ
║
║  🌙 _"Le monde doit connaître_
║      _la paix des Otsutsuki."_
║
${footer}
*© 2026 ᴏᴛsᴜᴛsᴜᴋɪ ʟᴇɢᴀᴄʏ*`;

        const darkImage = config.MENU_IMG || 'https://telegra.ph/file/0c9269550e68d011f0165.jpg';

        await sock.sendMessage(from, { 
            image: { url: darkImage }, 
            caption: texteMenu,
            mentions: [sender],
            contextInfo: {
                externalAdReply: {
                    title: "ＯＴＳＵＴＳＵＫＩ  ＳＹＳＴＥＭ  Ｖ２",
                    body: "Chakra Status: Stable | " + time,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnailUrl: darkImage,
                    sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                }
            }
        }, { quoted: m });

    } catch (e) {
        console.error("Erreur Menu Style:", e);
        // Secours si l'image crash encore
        await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Chakra instable. Menu en mode texte uniquement." });
    }
};
