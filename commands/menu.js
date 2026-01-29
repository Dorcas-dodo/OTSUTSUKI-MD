const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const prefix = config.PREFIXE;
        const user = sender.split('@')[0];
        
        // --- ⏳ CALCUL DE L'UPTIME ---
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

        // --- 📂 CLASSEMENT DYNAMIQUE DES COMMANDES ---
        const commandsDir = path.join(process.cwd(), 'commands');
        const files = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
        
        const categories = {
            général: [],
            clan_groupe: [],
            protection: [],
            outils: [],
            maitrise: []
        };

        files.forEach(file => {
            const cmd = file.replace('.js', '');
            const name = `│ 🏮 ${prefix}${cmd}`;

            // Logique de triage par mots-clés
            if (['ping', 'infos', 'runtime', 'help', 'menu', 'test'].includes(cmd)) {
                categories.général.push(name);
            } else if (['add', 'kick', 'promote', 'demote', 'tagall', 'group', 'tag', 'kickall', 'hidetag'].includes(cmd)) {
                categories.clan_groupe.push(name);
            } else if (cmd.startsWith('anti') || ['ban', 'clear', 'antilink'].includes(cmd)) {
                categories.protection.push(name);
            } else if (['sticker', 'ai', 'vv', 'attp', 'tgs', 'welcome', 'goodbye'].includes(cmd)) {
                categories.outils.push(name);
            } else {
                categories.maitrise.push(name); // Tout le reste (mode, reboot, owner...)
            }
        });

        const texteMenu = `
⛩️ *｢ OTSUTSUKI-MD ｣* ⛩️
╔════════════════════╗
┃  🏮 *PROFIL SHINOBI*
┃  👤 *User:* @${user}
┃  🎐 *Prefix:* [ ${prefix} ]
┃  🌀 *Clan:* Otsutsuki Legacy
┃  ⚙️ *Mode:* ${config.MODE.toUpperCase()}
┃  ⏳ *Uptime:* ${uptimeString}
┃  📍 *Loc:* Brazzaville, CG
╚════════════════════╝

┌───  🌑 *GÉNÉRAL* ────
${categories.général.sort().join('\n') || '│ 🏮 (Aucune)'}
└───────────────────

┌───  🌀 *CLAN & GROUPE* ───
${categories.clan_groupe.sort().join('\n') || '│ 🏮 (Aucune)'}
└───────────────────

┌───  🛡️ *PROTECTION* ────
${categories.protection.sort().join('\n') || '│ 🏮 (Aucune)'}
└───────────────────

┌───  🛠️ *OUTILS & NINJUTSU* ──
${categories.outils.sort().join('\n') || '│ 🏮 (Aucune)'}
└───────────────────

┌───  ⚡ *MAÎTRISE (OWNER)* ──
${categories.maitrise.sort().join('\n') || '│ 🏮 (Aucune)'}
└───────────────────

🌊 _"Le pouvoir des dieux entre vos mains."_
    🏮 *CLAN OTSUTSUKI* 🏮`;

        // Chemins médias (Utilise l'URL du config si les fichiers locaux n'existent pas)
        const mediaDir = path.join(process.cwd(), 'media');
        const imagePath = path.join(mediaDir, 'menu.jpg');
        
        const contextInfo = {
            externalAdReply: {
                title: "O T S U T S U K I  S Y S T E M",
                body: `Shinobi ID: ${user}`,
                mediaType: 1,
                renderLargerThumbnail: true,
                showAdAttribution: true,
                sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD",
                thumbnailUrl: config.MENU_IMG
            }
        };

        // Envoi avec Image locale ou URL distante
        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(from, { 
                image: fs.readFileSync(imagePath), 
                caption: texteMenu,
                mentions: [sender],
                contextInfo
            }, { quoted: m });
        } else {
            await sock.sendMessage(from, { 
                image: { url: config.MENU_IMG }, 
                caption: texteMenu,
                mentions: [sender],
                contextInfo
            }, { quoted: m });
        }

    } catch (e) {
        console.error("❌ Erreur Menu :", e);
        await sock.sendMessage(m.key.remoteJid, { text: "Erreur lors de la génération du menu." });
    }
};
