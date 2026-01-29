const config = require('../config');

module.exports = async (sock, m, args) => {
    try {
        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        // 1. Vérification Groupe
        if (!isGroup) return sock.sendMessage(from, { text: "🏮 Cette technique ne s'utilise qu'en groupe." });

        // 2. Vérification Permissions (Admin ou Owner)
        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants;
        const sender = m.key.participant || m.key.remoteJid;
        const isAdmin = participants.find(p => p.id === sender)?.admin;
        const isOwner = sender.includes(config.OWNER_NUMBER) || m.key.fromMe;

        if (!isAdmin && !isOwner) {
            return sock.sendMessage(from, { text: "🚷 Seul un membre du Conseil Otsutsuki peut invoquer tout le clan." });
        }

        // 3. Construction du message stylé
        let msgTag = `⛩️ *｢ INVOCATION DU CLAN ｣* ⛩️\n\n`;
        msgTag += `📜 *MESSAGE :* ${args.join(" ") || "Aucun message transmis"}\n`;
        msgTag += `👥 *MEMBRES :* ${participants.length}\n`;
        msgTag += `👤 *AUTEUR :* @${sender.split('@')[0]}\n\n`;
        msgTag += `┏━━━━━━━━━━━━━━━━━━━━┓\n`;

        let mentions = [];
        for (let mem of participants) {
            msgTag += `┃ 🏮 @${mem.id.split('@')[0]}\n`;
            mentions.push(mem.id);
        }

        msgTag += `┗━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        msgTag += `🌑 _"Soyez témoins de la puissance des Dieux."_`;

        // 4. Envoi avec AdReply (Vignette) pour le style
        await sock.sendMessage(from, {
            text: msgTag,
            mentions: mentions,
            contextInfo: {
                externalAdReply: {
                    title: "O T S U T S U K I - M D",
                    body: "TAG ALL SYSTEM",
                    mediaType: 1,
                    thumbnailUrl: config.MENU_IMG,
                    sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD",
                    renderLargerThumbnail: false,
                    showAdAttribution: true
                }
            }
        }, { quoted: m });

    } catch (e) {
        console.error("❌ Erreur Tagall :", e);
        await sock.sendMessage(from, { text: "⚠️ Le chakra a été perturbé. Impossible de taguer." });
    }
};
