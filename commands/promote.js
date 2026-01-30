// --- 🔎 RÉCUPÉRATION DES DROITS ---
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = m.key.participant || m.key.remoteJid;

        // 1. Est-ce que CELUI QUI ENVOIE est admin ?
        const isAdmin = participants.find(p => p.id === sender)?.admin;

        // 2. Est-ce que LE BOT est admin ? (MÉTHODE ULTRA-ROBUSTE)
        // On prend juste les chiffres du bot pour éviter les bugs d'ID
        const botNumber = sock.user.id.split(':')[0];
        const isBotAdmin = participants.find(p => p.id.includes(botNumber))?.admin;

        // --- 🛡️ LOGIQUE DE PERMISSION ---
        // Si tu es le MAÎTRE (isOwner=vrai), tu passes même si tu n'as pas l'étoile d'admin
        if (!isOwner && !isAdmin) {
            return sock.sendMessage(from, { text: "🏮 Seuls les hauts gradés ou le Maître peuvent faire ça." });
        }

        // Par contre, le BOT doit REELLEMENT être admin WhatsApp pour agir
        if (!isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ Action impossible : L'Otsutsuki-MD n'est pas Administrateur de ce groupe." });
        }
