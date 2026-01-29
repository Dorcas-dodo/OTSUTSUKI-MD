module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    // 1. Vérifications de base
    if (!isGroup) return sock.sendMessage(from, { text: "Cette commande est réservée aux groupes ! ❌" });

    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;
    
    // Vérifier si l'utilisateur est admin
    const isAdmin = participants.find(p => p.id === m.key.participant)?.admin;
    // Vérifier si le bot est admin
    const isBotAdmin = participants.find(p => p.id === (sock.user.id.split(':')[0] + '@s.whatsapp.net'))?.admin;

    if (!isAdmin) return sock.sendMessage(from, { text: "Seuls les hauts gradés du clan peuvent inviter des membres. 🏮" });
    if (!isBotAdmin) return sock.sendMessage(from, { text: "Je dois être administrateur pour invoquer de nouveaux membres. ❌" });

    // 2. Récupération du numéro
    let userToAdd = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;
    
    if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        userToAdd = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }

    if (!userToAdd) return sock.sendMessage(from, { text: "Veuillez entrer le numéro du Shinobi à ajouter.\nExemple : *.add 24206461XXXX*" });

    try {
        // 3. Exécution de l'ajout
        const response = await sock.groupParticipantsUpdate(from, [userToAdd], "add");
        
        // WhatsApp peut parfois envoyer une invitation si les réglages de confidentialité de l'utilisateur sont stricts
        if (response[0].status === "403") {
            return sock.sendMessage(from, { text: "⚠️ Impossible d'ajouter ce membre directement à cause de ses paramètres de confidentialité. Une invitation a été envoyée." });
        }

        await sock.sendMessage(from, { 
            text: `✨ @${userToAdd.split('@')[0]} a été intégré au clan avec succès !`, 
            mentions: [userToAdd] 
        });

    } catch (err) {
        console.error("Erreur Add :", err);
        await sock.sendMessage(from, { text: "Échec de l'invocation. Le numéro est peut-être invalide ou le membre est déjà présent. ❌" });
    }
};
