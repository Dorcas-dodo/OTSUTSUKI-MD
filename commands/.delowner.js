const fs = require('fs');
const path = require('path');

module.exports = async (sock, m, args, { isOwner }) => {
    try {
        const from = m.key.remoteJid;

        // 🛡️ SÉCURITÉ : Seul un Maître peut retirer des privilèges
        if (!isOwner) {
            return sock.sendMessage(from, { text: "🏮 Votre rang ne vous permet pas de destituer un Maître." });
        }

        // 👤 RÉCUPÉRATION DE LA CIBLE
        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                     m.message?.extendedTextMessage?.contextInfo?.participant || 
                     (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!target) {
            return sock.sendMessage(from, { text: "👤 Mentionnez le Shinobi à destituer ou répondez à son message." });
        }

        const targetNum = target.split('@')[0];
        const dataPath = './data/owners.json';

        // Protection contre l'auto-destitution des numéros système "en dur"
        const systemMasters = ['242066969267', '225232933638352'];
        if (systemMasters.includes(targetNum)) {
            return sock.sendMessage(from, { text: "⚠️ Impossible de destituer un Otsutsuki Originel. Son chakra est éternel." });
        }

        if (!fs.existsSync(dataPath)) {
            return sock.sendMessage(from, { text: "🏮 Aucun Maître additionnel n'est enregistré dans les archives." });
        }

        let owners = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        if (!owners.includes(targetNum)) {
            return sock.sendMessage(from, { text: "🏮 Ce Shinobi ne figure pas dans la liste des Maîtres." });
        }

        // Retrait du numéro
        owners = owners.filter(num => num !== targetNum);
        fs.writeFileSync(dataPath, JSON.stringify(owners, null, 2));

        await sock.sendMessage(from, { 
            text: `📉 *DESTITUTION* 📉\n\nLe Shinobi @${targetNum} a perdu ses privilèges divins. Il redevient un simple membre du clan.`,
            mentions: [target]
        });

    } catch (e) {
        console.error("Erreur DelOwner :", e);
        await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Échec de la rupture de chakra." });
    }
};
