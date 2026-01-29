module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const config = require('../config');

    // On retire les caractères non numériques du numéro dans config
    const cleanNumber = config.OWNER_NUMBER.replace(/[^0-9]/g, '');

    // 1. Envoi du message avec l'image du Maître
    const ownerMsg = `
╔════════════════════╗
   ⛩️  *MAÎTRE OTSUTSUKI* ⛩️
╚════════════════════╝

🏮 *Nom :* ${config.OWNER_NAME || "Dorcas-dodo"}
🌀 *Rang :* Fondateur & Développeur
🌑 *Statut :* En ligne

🌊 _"Le destin ne se discute pas, il s'impose. Contactez mon créateur pour toute question."_

🏮 *OTSUTSUKI-MD SYSTEM* 🏮
    `;

    // 2. Création de la VCard (Fiche contact WhatsApp)
    const vcard = 'BEGIN:VCARD\n' 
                + 'VERSION:3.0\n' 
                + `FN:${config.OWNER_NAME || "Owner"}\n` 
                + `ORG:Otsutsuki Clan;\n`
                + `TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\n` 
                + 'END:VCARD';

    // Envoi de l'image + texte
    await sock.sendMessage(from, {
        image: { url: 'https://raw.githubusercontent.com/Dorcas-dodo/OTSUTSUKI-MD/master/media/menu.jpg' },
        caption: ownerMsg
    });

    // Envoi du contact
    await sock.sendMessage(from, {
        contacts: {
            displayName: config.OWNER_NAME,
            contacts: [{ vcard }]
        }
    });
};
