module.exports = async (sock, m, args, { isBotAdmin, isSenderAdmin, isOwner, from }) => {
    try {
        // 1. Vérifications de sécurité
        if (!m.isGroup) return m.reply("⛩️ Cette technique ne fonctionne que dans les groupes.");
        
        // On utilise la variable isBotAdmin déjà calculée par ton handler principal
        if (!isBotAdmin) return m.reply("❌ Erreur : L'Otsutsuki-MD doit être admin pour inviter.");
        
        // Seuls les admins ou l'owner peuvent ajouter des gens
        if (!isSenderAdmin && !isOwner) return m.reply("❌ Seul un haut gradé du clan peut invoquer des membres.");

        // 2. Récupération du numéro
        let user = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : 
                   m.message?.extendedTextMessage?.contextInfo?.participant;

        if (!user || user.length < 10) {
            return m.reply("👤 Désigne le Shinobi par son numéro (ex: .add 242066969267) ou répond à son message.");
        }

        // 3. Exécution de l'ajout
        const response = await sock.groupParticipantsUpdate(from, [user], "add");

        /* Note technique : Baileys renvoie souvent un statut 403 si l'utilisateur a 
           bloqué les ajouts automatiques (invitation privée requise).
        */
        if (response[0].status === "403") {
            return m.reply("⚠️ Ce Shinobi a scellé ses invitations. Je dois lui envoyer un lien d'invitation en privé.");
        }

        await m.reply(`✅ @${user.split('@')[0]} a été invoqué dans la dimension.`, { mentions: [user] });

    } catch (e) {
        console.error("Erreur Add Command:", e);
        m.reply("⚠️ Impossible d'ajouter ce Shinobi. Vérifie s'il est déjà dans le groupe ou si son numéro est correct.");
    }
};
