const fs = require('fs');
const config = require('../config');

module.exports = {
    name: "menu",
    async execute(sock, from, msg) {
        const menuText = `
╭━━〔 *${config.NOM_BOT}* 〕━━┈
┃ 👤 *Owner:* ${config.NOM_OWNER}
┃ 🚀 *Prefix:* ${config.PREFIXE}
╰━━━━━━━━━━━━━━━━━━┈

*📜 COMMANDES DISPONIBLES :*
- .kick (Expulser)
- .kickall (Vider groupe)
- .gpt (IA Chat)
- .attp (Sticker texte)
- .antidelete (on/off)
- .autostatus (on/off)
- .bible (Verset)
- .character (Analyse)

*🛡️ PROTECTION*
- Anti-Link : Activé
- Anti-Badword : Activé
- Anti-Delete : Activé
`.trim();

        // 1. Envoyer l'image
        await sock.sendMessage(from, {
            image: fs.readFileSync(config.MENU_IMG),
            caption: menuText
        });

        // 2. Envoyer le son (menu.mp3)
        await sock.sendMessage(from, {
            audio: fs.readFileSync(config.MENU_SON),
            mimetype: 'audio/mp4',
            ptt: true
        });
    }
};
