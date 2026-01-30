const fs = require('fs');
const path = require('path');

module.exports = async (sock, chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m || !m.message) return;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        const text = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || "";
                     
        const config = require('./config');
        const sender = m.key.participant || m.key.remoteJid;

        // --- 🔎 RECONNAISSANCE MAÎTRE ULTRA-FLEXIBLE ---
        // On nettoie l'expéditeur (enlève les lettres/symboles)
        const cleanSender = sender.split('@')[0].replace(/[^0-9]/g, '');
        
        // Tes numéros de confiance (Congo, Côte d'Ivoire, et Config)
        const master1 = '242066969267';
        const master2 = '225232933638352'; // Détecté dans tes logs !
        const cleanOwner = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : master1;
        
        // Utilisation de .includes() pour bypasser les identifiants d'appareil (:4, :12, etc.)
        const isOwner = m.key.fromMe || 
                        cleanSender.includes(master1) || 
                        cleanSender.includes(master2) || 
                        cleanSender.includes(cleanOwner);

        // --- 🚫 VÉRIFICATION DU BANNISSEMENT (Sauf pour le Maître) ---
        const bannedPath = './data/banned.json';
        if (fs.existsSync(bannedPath) && !isOwner) {
            const bannedList = JSON.parse(fs.readFileSync(bannedPath, 'utf-8'));
            if (bannedList.includes(sender)) return;
        }

        // --- 1. SYSTÈME ANTILINK ---
        if (isGroup && config.ANTILINK) {
            const linkPattern = /https?:\/\/\S+|chat\.whatsapp\.com\/\S+/i;
            if (linkPattern.test(text)) {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants;
                const isAdmin = participants.find(p => p.id === sender)?.admin;
                const isBotAdmin = participants.find(p => p.id === (sock.user.id.split(':')[0] + '@s.whatsapp.net'))?.admin;

                if (!isAdmin && isBotAdmin) {
                    await sock.sendMessage(from, { delete: m.key });
                    await sock.groupParticipantsUpdate(from, [sender], "remove");
                    return;
                }
            }
        }

        // --- 2. VÉRIFICATION DU MODE ---
        if (config.MODE === 'self' && !isOwner) return;

        // --- 3. TRAITEMENT DES COMMANDES ---
        const prefix = config.PREFIXE || ".";
        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/
