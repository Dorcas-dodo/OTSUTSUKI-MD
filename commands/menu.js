const menu = async (sock, from, sender, mentionedJids, msg) => {
    const config = require('../config');

    let texteMenu = `
┏━━━━━━〔 ⛩️ *${config.NOM_BOT}* ⛩️ 〕━━━━━━┓
┃
┃ 👤 *USER* : @${sender.split('@')[0]}
┃ 🛠️ *PREFIXE* : [ ${config.PREFIXE} ]
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃      👥 *MENU GROUPE*
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
┃ ✧ ${config.PREFIXE}kick
┃ ✧ ${config.PREFIXE}tagall
┃ ✧ ${config.PREFIXE}group
┃ ✧ ${config.PREFIXE}kickall
┃ ✧ ${config.PREFIXE}tag
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃      🤖 *MENU I.A & FUN*
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
┃ ✧ ${config.PREFIXE}ai
┃ ✧ ${config.PREFIXE}attp
┃ ✧ ${config.PREFIXE}vv (View Once)
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃      🛡️ *SYSTÈME*
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
┃ ✧ ${config.PREFIXE}antidelete-cmd
┃ ✧ ${config.PREFIXE}ban
┃ ✧ ${config.PREFIXE}clear
┃ ✧ ${config.PREFIXE}infos
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

    await sock.sendMessage(from, { 
        text: texteMenu, 
        mentions: [sender]
    }, { quoted: msg });
};

module.exports = menu;