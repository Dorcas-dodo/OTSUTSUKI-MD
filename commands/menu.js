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
        
        // --- 📊 INFOS TEMPS RÉEL (Pré-calculées) ---
        const date = moment.tz('Africa/Brazzaville').format('DD/MM/YYYY');
        const time = moment.tz('Africa/Brazzaville').format('HH:mm:ss');
        const uptime = process.uptime();
        const uptimeString = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;

        // --- 📂 LOGIQUE DE TRIAGE RAPIDE ---
        const commandsDir = path.join(process.cwd(), 'commands');
        const files = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
        
        const categories = { general: [], admin: [], protect: [], ninja: [], owner: [] };

        files.forEach(file => {
            const cmd = file.replace('.js', '');
            const styleCmd = `  ◦ ${cmd.toUpperCase()}`;
            if (['ping', 'infos', 'runtime', 'menu', 'test', 'speed'].includes(cmd)) categories.general.push(styleCmd);
            else if (['add', 'kick', 'promote', 'demote', 'tagall', 'hidetag', 'group'].includes(cmd)) categories.admin.push(styleCmd);
            else if (cmd.startsWith('anti') || ['ban', 'clear', 'warn'].includes(cmd)) categories.protect.push(styleCmd);
            else if (['sticker', 'ai', 'vv', 'attp', 'edit', 'cls'].includes(cmd)) categories.ninja.push(styleCmd);
            else categories.owner.push(styleCmd);
        });

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

        // --- ⚡ ENVOI SIMULTANÉ ---
        
        // 1. Préparation de l'audio
        const audioPath = path.join(process.cwd(), 'media', 'menu.mp3');

        // 2. Envoi du Menu (Image + Texte)
        const sendMenu = sock.sendMessage(from, { 
            image: { url: config.MENU_IMG }, 
            caption: texteMenu,
            mentions: [sender],
            contextInfo: {
                externalAdReply: {
                    title: `CONNECTED: ${config.BOT_NAME}`,
                    body: `Brazzaville Status: Online 🟢`,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnailUrl: config.MENU_IMG,
                    sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                }
            }
        }, { quoted: m });

        // 3. Lancement de l'audio en parallèle (si présent)
        if (fs.existsSync(audioPath)) {
            sock.sendMessage(from, { 
                audio: { url: audioPath }, // Stream direct sans lire tout le fichier d'un coup
                mimetype: 'audio/mp4', 
                ptt: true 
            }, { quoted: m });
        }

        // On attend seulement la fin de l'envoi du menu pour finir la fonction
        await sendMenu;

    } catch (e) {
        console.error("❌ Erreur Menu :", e);
        await sock.sendMessage(m.key.remoteJid, { text: "Erreur chakra : " + e.message });
    }
};
