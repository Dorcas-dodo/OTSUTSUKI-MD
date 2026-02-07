const { getContentType } = require('@whiskeysockets/baileys');

/**
 * OTSUTSUKI-MD - Analyseur de Message (v2.5)
 * Optimisé pour la réactivité dans les groupes et la gestion des médias.
 */
module.exports = async (sock, m) => {
    if (!m) return m;

    // --- 🔹 IDENTIFICATION DE BASE ---
    if (m.key) {
        m.id = m.key.id;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        
        // Identification précise de l'expéditeur
        m.sender = m.fromMe ? (sock.user.id.split(':')[0] + '@s.whatsapp.net') : (m.isGroup ? m.key.participant : m.key.remoteJid);
        
        // Numéro propre (ex: 242068079834)
        m.senderNumber = m.sender.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    }

    // --- 🔹 ANALYSE DU CONTENU (BODY) ---
    if (m.message) {
        m.mtype = getContentType(m.message);
        
        // On récupère le corps du message (Body) de manière exhaustive
        m.body = (m.mtype === 'conversation') ? m.message.conversation : 
                 (m.mtype === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                 (m.mtype === 'imageMessage') ? m.message.imageMessage.caption : 
                 (m.mtype === 'videoMessage') ? m.message.videoMessage.caption : 
                 (m.mtype === 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : 
                 (m.mtype === 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : 
                 (m.mtype === 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : 
                 (m.message[m.mtype]?.caption) ? m.message[m.mtype].caption : 
                 (m.message[m.mtype]?.text) ? m.message[m.mtype].text : '';

        // Raccourci intelligent pour répondre avec mention auto
        m.reply = async (text) => {
            return await sock.sendMessage(m.chat, { 
                text: text, 
                mentions: [m.sender] 
            }, { quoted: m });
        };
        
        // Raccourci pour réagir rapidement
        m.react = async (emoji) => {
            return await sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
        };
    }

    // --- 🔹 GESTION MODERNE DES DROITS (isAdmin) ---
    m.isBotAdmin = false;
    m.isSenderAdmin = false;

    if (m.isGroup) {
        try {
            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants || [];
            const botNumber = sock.user.id.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

            const bot = participants.find(p => p.id.replace(/[^0-9]/g, '').startsWith(botNumber));
            const sender = participants.find(p => p.id === m.sender);

            if (bot && (bot.admin === 'admin' || bot.admin === 'superadmin')) m.isBotAdmin = true;
            if (sender && (sender.admin === 'admin' || sender.admin === 'superadmin')) m.isSenderAdmin = true;
        } catch (e) {
            m.isBotAdmin = false;
            m.isSenderAdmin = false;
        }
    }

    // --- 🔹 GESTION DES MESSAGES CITÉS (QUOTED) ---
    m.quoted = null;
    const quotedContext = m.message?.extendedTextMessage?.contextInfo || m.message[m.mtype]?.contextInfo;
    
    if (quotedContext?.quotedMessage) {
        const q = quotedContext;
        m.quoted = {};
        m.quoted.id = q.stanzaId;
        m.quoted.chat = m.chat;
        m.quoted.sender = q.participant;
        m.quoted.fromMe = m.quoted.sender === (sock.user && sock.user.id);
        m.quoted.mtype = getContentType(q.quotedMessage);
        
        m.quoted.body = q.quotedMessage?.conversation || 
                        q.quotedMessage?.extendedTextMessage?.text || 
                        q.quotedMessage[m.quoted.mtype]?.caption || 
                        q.quotedMessage[m.quoted.mtype]?.text || "";
                        
        m.quoted.delete = async () => await sock.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: m.quoted.fromMe, id: m.quoted.id, participant: m.quoted.sender } });
    }

    return m;
};
