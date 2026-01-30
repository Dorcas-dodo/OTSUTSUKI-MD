const fs = require('fs');
const path = require('path');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;

        // 🛡️ SÉCURITÉ : Seul le Maître originel peut nommer d'autres Maîtres
        if (!isOwner) {
            return sock.sendMessage(from, { text: "🏮 Seul l'Otsutsuki Originel peut partager son pouvoir." });
        }

        // 👤 RÉCUPÉRATION DE LA CIBLE
        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                     m.message?.extendedTextMessage?.contextInfo?.participant || 
                     (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!target) {
            return sock.sendMessage(from, { text: "👤 Mentionnez le Shinobi à qui vous voulez léguer votre puissance." });
        }

        const targetNum = target.split('@')[0];
        const dataPath = path.join(__dirname, '../data/owners.json');

        // Créer le dossier data s'il n'existe pas
        if (!fs.existsSync(path.join(__dirname, '../data'))) {
            fs.mkdirSync(path.join(__dirname, '../data'));
        }

        let owners = [];
        if (fs.existsSync(dataPath)) {
            owners = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        }

        if (owners.includes(targetNum)) {
            return sock.sendMessage(from, { text: "🏮 Ce Shinobi possède déjà l'essence des Otsutsuki." });
        }

        // Ajout et sauvegarde
        owners.push(targetNum);
        fs.writeFileSync(dataPath, JSON.stringify(owners, null, 2));

        await sock.sendMessage(from, { 
            text: `✨ *ÉLÉVATION DIVINE* ✨\n\nLe Shinobi @${targetNum} a reçu les pouvoirs de l'Otsutsuki. Il est désormais reconnu comme Maître par le système.`,
            mentions: [target]
        });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Échec du transfert de chakra." });
    }
};
