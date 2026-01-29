const fs = require('fs');
const path = require('path');
const config = require('../config');
const moment = require('moment-timezone');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        
        // --- 📊 CALCULS ULTRA-RAPIDES ---
        const uptime = process.uptime();
        const uptimeString = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;
        const date = moment.tz('Africa/Brazzaville').format('DD/MM/YYYY');
        const time = moment.tz('Africa/Brazzaville').format('HH:mm:ss');

        // --- 📂 LOGIQUE DE TRIAGE (Cache-friendly) ---
        const commandsDir = path.join(process.cwd(), 'commands');
        const files = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
        
        const categories = { general: [], admin: [], protect: [], ninja: [], owner: [] };

        for (const file of files) {
            const cmd = file.replace('.js', '');
            const styleCmd = `  ◦ ${cmd.toUpperCase()}`;
            if (['ping', 'infos', 'runtime', 'menu', 'test', 'speed'].includes(cmd)) categories.general.push(styleCmd);
            else if (['add', 'kick', 'promote', 'demote', 'tagall', 'hidetag', 'group'].includes(cmd)) categories.admin.push(styleCmd);
            else if (cmd.startsWith('anti') || ['ban', 'clear', 'warn'].includes(cmd)) categories.protect.push(styleCmd);
            else if (['sticker', 'ai', 'vv', 'attp', 'edit', 'cls'].includes(cmd)) categories.ninja.push(styleCmd);
            else categories.owner.push(styleCmd);
        }

        const texteMenu = `
┏━━〔 *OTSUTSUKI-MD* 〕━━┓
┃ 👤 *SHINOBI :* @${sender.split('@')[0]}
┃ 🧬 *CLAN :* ${config.OWNER_NAME}
┃ 🏮 *PREFIX :* ${config.PREFIXE}
┃ ⏱️ *UPTIME :* ${uptimeString}
┃ 📡 *MODE :* ${config.MODE}
┗━━━━━━━━━━━━━━━━━━━━┛

🚀 *COMMANDES :* ${files.length}
📅 *DATE :* ${date} | ⏳ *HEURE :* ${time}

💠 *「 GÉNÉRAL 」*
${categories.general.sort().join('\n')}

💠 *「 ADMIN & CLAN 」*
${categories.admin.sort().join('\n')}

💠 *「 PROTECTION 」*
${categories.protect.sort().join('\n')}

💠 *「 NINJUTSU ART 」*
${categories.ninja.sort().join('\n')}

💠 *「 MAÎTRISE SUPRÊME 」*
${categories.owner.sort().join('\n')}

┏━━━━━━━━━━━━━━━━━━━━┓
┃  ⚡ _"Rien n'échappe à l'œil_
┃  _des divinités Otsutsuki."_
┗━━━━━━━━━━━━━━━━━━━━┛`;

        // --- ⚡ ENVOI ÉCLAIR ---

        // 1. On envoie l'image en premier (Sans attendre l'audio)
        // Note: renderLargerThumbnail est mis à false pour un affichage 2x plus rapide
        await sock.sendMessage(from, { 
            image: { url: config.MENU_IMG }, 
            caption: texteMenu,
            mentions: [sender],
            contextInfo: {
                externalAdReply: {
                    title: `OTSUTSUKI SYSTEM : ${time}`,
                    body: `Latence: stable 🟢`,
                    mediaType: 1,
                    renderLargerThumbnail: false, 
                    thumbnailUrl: config.MENU_IMG,
                    sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                }
            }
        }, { quoted: m });

        // 2. L'audio s'envoie en arrière-plan (On ne met pas "await")
        const audioPath = path.join(process.cwd(), 'media', 'menu.mp3');
        if (fs.existsSync(audioPath)) {
            sock.sendMessage(from, { 
                audio: { url: audioPath }, 
                mimetype: 'audio/mp4', 
                ptt: true 
            }).catch(e => console.log("Erreur audio ignoree"));
        }

    } catch (e) {
        console.error("❌ Erreur Menu :", e);
    }
};
