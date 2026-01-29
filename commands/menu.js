const fs = require('fs');
const path = require('path');
const config = require('../config');
const moment = require('moment-timezone');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const prefix = config.PREFIXE;
        const user = sender.split('@')[0];
        
        // --- 📊 INFOS TEMPS RÉEL ---
        const date = moment.tz('Africa/Brazzaville').format('DD/MM/YYYY');
        const time = moment.tz('Africa/Brazzaville').format('HH:mm:ss');
        
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const uptimeString = `${hours}h ${minutes}m`;

        // --- 📂 LOGIQUE DE TRIAGE ---
        const commandsDir = path.join(process.cwd(), 'commands');
        const files = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
        
        const categories = {
            general: [],
            admin: [],
            protect: [],
            ninja: [],
            owner: []
        };

        files.forEach(file => {
            const cmd = file.replace('.js', '');
            const styleCmd = `  ◦ ${cmd.toUpperCase()}`;

            if (['ping', 'infos', 'runtime', 'menu', 'test', 'speed'].includes(cmd)) {
                categories.general.push(styleCmd);
            } else if (['add', 'kick', 'promote', 'demote', 'tagall', 'hidetag', 'group'].includes(cmd)) {
                categories.admin.push(styleCmd);
            } else if (cmd.startsWith('anti') || ['ban', 'clear', 'warn'].includes(cmd)) {
                categories.protect.push(styleCmd);
            } else if (['sticker', 'ai', 'vv', 'attp', 'edit', 'cls'].includes(cmd)) {
                categories.ninja.push(styleCmd);
            } else {
                categories.owner.push(styleCmd);
            }
        });

        // --- ⛩️ DESIGN DU TEXTE ---
        const texteMenu = `
┏━━〔 *OTSUTSUKI-MD* 〕━━┓
┃ 👤 *SHINOBI :* @${user}
┃ 🧬 *CLAN :* ${config.OWNER_NAME}
┃ 🏮 *PREFIX :* ${prefix}
┃ ⏱️ *UPTIME :* ${uptimeString}
┃ 📡 *MODE :* ${config.MODE}
┗━━━━━━━━━━━━━━━━━━━━┛

╔════════════════════╗
    *DASHBOARD COMMANDS*
╚════════════════════╝
 📅 *DATE :* ${date}
 ⏳ *HEURE :* ${time}
 🚀 *COMMANDES :* ${files.length}

💠 *「 GÉNÉRAL 」*
${categories.general.sort().join('\n') || '  ◦ (Vide)'}

💠 *「 ADMIN & CLAN 」*
${categories.admin.sort().join('\n') || '  ◦ (Vide)'}

💠 *「 PROTECTION 」*
${categories.protect.sort().join('\n') || '  ◦ (Vide)'}

💠 *「 NINJUTSU ART 」*
${categories.ninja.sort().join('\n') || '  ◦ (Vide)'}

💠 *「 MAÎTRISE SUPRÊME 」*
${categories.owner.sort().join('\n') || '  ◦ (Vide)'}

┏━━━━━━━━━━━━━━━━━━━━┓
┃  ⚡ _"Rien n'échappe à l'œil_
┃  _des divinités Otsutsuki."_
┗━━━━━━━━━━━━━━━━━━━━┛`;

        // --- 1. ENVOI DE L'IMAGE AVEC VIGNETTE ---
        const contextInfo = {
            externalAdReply: {
                title: `CONNECTED: ${config.BOT_NAME}`,
                body: `Brazzaville Status: Online 🟢`,
                mediaType: 1,
                renderLargerThumbnail: true,
                showAdAttribution: false,
                sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD",
                thumbnailUrl: config.MENU_IMG
            }
        };

        await sock.sendMessage(from, { 
            image: { url: config.MENU_IMG }, 
            caption: texteMenu,
            mentions: [sender],
            contextInfo
        }, { quoted: m });

        // --- 2. ENVOI DE L'AUDIO (SYCHRONISÉ) ---
        const audioPath = path.join(process.cwd(), 'media', 'menu.mp3');

        if (fs.existsSync(audioPath)) {
            await sock.sendMessage(from, { 
                audio: fs.readFileSync(audioPath), 
                mimetype: 'audio/mp4', 
                ptt: true // true pour envoyer comme note vocale
            }, { quoted: m });
        } else {
            console.log("⚠️ Fichier menu.mp3 absent du dossier media");
        }

    } catch (e) {
        console.error("❌ Erreur Menu :", e);
        await sock.sendMessage(m.key.remoteJid, { text: "Le chakra est instable. Erreur Menu." });
    }
};
