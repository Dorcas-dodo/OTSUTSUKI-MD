const { getContentType } = require('@whiskeysockets/baileys');

/**
 * OTSUTSUKI-MD - Analyseur de Message (Modern Handler)
 * Ce script prépare toutes les propriétés du message avant exécution.
 */
module.exports = async (sock, m) => {
    if (!m) return m;

    // --- 🔹 IDENTIFICATION DE BASE ---
    if (m.key) {
        m.id = m.key.id;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        
        // Identification de l'expéditeur (sender)
        m.sender = m.fromMe ? sock.user.id : (m.isGroup ? m.key.participant : m.key.remoteJid);
        
        // Numéro pur sans suffixes (@s.whatsapp.net ou :4)
        m.senderNumber = m.sender.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    }

    // --- 🔹 ANALYSE DU CONTENU (BODY) ---
    if (m.message) {
        m.mtype = getContentType(m.message);
        
        // Extraction du texte peu importe le type de message (Image, Vidéo, Texte simple)
        m.body = (m.mtype === 'conversation') ? m.message.conversation : 
                 (m.mtype === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                 (m.mtype === 'imageMessage') ? m.message.imageMessage.caption : 
                 (m.mtype === 'videoMessage') ? m.message.videoMessage.caption : 
                 (m.mtype === 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : 
                 (m.mtype === 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : 
                 (m.mtype === 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : '';
        
        // Raccourci intelligent pour répondre (reply)
        m.reply = async (text) => {
            return await sock.sendMessage(m.chat, { 
                text: text, 
                mentions: [m.sender] 
            }, { quoted: m });
        };
    }

    // --- 🔹 GESTION MODERNE DES DROITS (isAdmin) ---
    m.isBotAdmin = false;
    m.isSenderAdmin = false;

    if (m.isGroup) {
        try {
            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants;
            const botNumber = sock.user.id.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

            // On parcourt les membres pour définir les rôles une fois pour toutes
            for (const p of participants) {
                const pNumber = p.id.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                const isAdmin = p.admin === 'admin' || p.admin === 'superadmin';

                if (pNumber === botNumber && isAdmin) m.isBotAdmin = true;
                if (pNumber === m.senderNumber && isAdmin) m.isSenderAdmin = true;
            }
        } catch (e) {
            // Échec silencieux si les métadonnées ne sont pas accessibles
            m.isBotAdmin = false;
            m.isSenderAdmin = false;
        }
    }

    // --- 🔹 QUOTED MESSAGE (Messages cités) ---
    m.quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage ? m.message.extendedTextMessage.contextInfo : null;
    if (m.quoted) {
        m.quoted.id = m.message.extendedTextMessage.contextInfo.stanzaId;
        m.quoted.sender = m.message.extendedTextMessage.contextInfo.participant;
        m.quoted.text = m.quoted.quotedMessage?.conversation || m.quoted.quotedMessage?.extendedTextMessage?.text || "";
    }

    return m;
};
