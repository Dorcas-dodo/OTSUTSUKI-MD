module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    // Vérification si on est dans un groupe
    if (!isGroup) return sock.sendMessage(from, { text: "Cette commande est réservée aux groupes ! ❌" });

    try {
        // Récupération des métadonnées du groupe
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const admins = participants.filter(p => p.admin).length;
        const owner = groupMetadata.owner || "Non défini";
        
        // Tentative de récupération de la photo de groupe
        let ppGroup;
        try {
            ppGroup = await sock.profilePictureUrl(from, 'image');
        } catch {
            ppGroup = 'https://raw.githubusercontent.com/Dorcas-dodo/OTSUTSUKI-MD/master/media/menu.jpg'; 
        }

        const infoText = `
╔════════════════════╗
   ⛩️  *INFOS DU CLAN* ⛩️
╚════════════════════╝

🏮 *Nom :* ${groupMetadata.subject}
🆔 *ID :* ${groupMetadata.id}
👑 *Créateur :* @${owner.split('@')[0]}
👥 *Membres :* ${participants.length}
⚔️ *Admins :* ${admins}
📅 *Créé le :* ${new Date(groupMetadata.creation * 1000).toLocaleString('fr-FR')}

📜 *DESCRIPTION :*
${groupMetadata.desc || "Aucune description définie."}

🏮 *OTSUTSUKI-MD SYSTEM* 🏮
        `;

        await sock.sendMessage(from, {
            image: { url: ppGroup },
            caption: infoText,
            mentions: [owner]
        });

    } catch (err) {
        console.error("Erreur ginfo :", err);
        await sock.sendMessage(from, { text: "Impossible de récupérer les informations du clan. ❌" });
    }
};
