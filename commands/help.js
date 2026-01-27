module.exports = {
    name: "help",
    async execute(sock, from, msg, args, config) {
        const menu = `
╔══════════════════╗
   🌕 *OTSUTSUKI-MD* 🌕
╚══════════════════╝

👋 *Salut !* Voici mes pouvoirs :

🛡️ *MODÉRATION*
- .kick / .kickall
- .ban / .unban
- .close / .open
- .antibadword (on/off)
- .antilink (on/off)

👋 *GROUPE*
- .welcome / .goodbye
- .groupinfo
- .hidetag

🤖 *IA & FUN*
- .gpt (Question)
- .attp (Tex text)
- .goodnight
- .character (Analyse)

⚙️ *SYSTÈME*
- .clearsession
- .cleartmp
- .autoviewstatus (on/off)

📌 *Prefix:* ${config.PREFIXE}
👑 *Owner:* ${config.NOM_OWNER}
`;
        await sock.sendMessage(from, { 
            image: { url: "https://files.catbox.moe/otsutsuki.jpg" }, 
            caption: menu 
        });
    }
};