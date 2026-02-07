module.exports = async (sock, m, args, { isAdmins, isOwner, participants }) => {
    try {
        const from = m.chat;

        // 1. SÉCURITÉ : On utilise les variables passées par le handler
        if (!isAdmins && !isOwner) {
            return sock.sendMessage(from, { 
                text: "⚠️ *ACCÈS REFUSÉ* : Tu n'as pas assez de chakra pour invoquer l'appel du clan. 🏮" 
            }, { quoted: m });
        }

        // 2. RÉCUPÉRATION DU MESSAGE
        // On vérifie les arguments ou si on a répondu à un message
        let message = args.join(" ");
        if (!message && m.quoted) message = m.quoted.text;

        if (!message) {
            return sock.sendMessage(from, { 
                text: "⛩️ *ÉREUR D'INVOCATION* : Quel message souhaites-tu transmettre au clan ?" 
            }, { quoted: m });
        }

        // 3. ENVOI DE L'APPEL GÉNÉRAL
        await sock.sendMessage(from, { 
            text: message, 
            mentions: participants.map(p => p.id) // Tag invisible de tout le monde
        });

        // 4. RÉACTION VISUELLE
        await sock.sendMessage(from, { react: { text: "📢", key: m.key } });

    } catch (e) {
        console.error("Erreur Hidetag :", e);
    }
};
