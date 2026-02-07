const { getContentType } = require('@whiskeysockets/baileys');

module.exports = async (sock, m) => {
    if (!m) return m;

    if (m.key) {
        m.id = m.key.id;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        
        // Nettoyage JID pour éviter les :4 ou :2
        const userJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        m.sender = m.fromMe ? userJid : (m.isGroup ? m.key.participant : m.key.remoteJid);
        
        m.senderNumber = m.sender.split('@')[0].replace(/[^0-9]/g, '');
    }

    if (m.message) {
        m.mtype = getContentType(m.message);
        m.body = (m.mtype === 'conversation') ? m.message.conversation : 
                 (m.mtype === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                 (m.mtype === 'imageMessage') ? m.message.imageMessage.caption : 
                 (m.mtype === 'videoMessage') ? m.message.videoMessage.caption : 
                 (m.mtype === 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : 
                 (m.mtype === 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : 
                 (m.mtype === 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : 
                 (m.message[m.mtype]?.caption) ? m.message[m.mtype].caption : 
                 (m.message[m.mtype]?.text) ? m.message[m.mtype].text : '';

        m.reply = async (text) => {
            return await sock.sendMessage(m.chat, { text: text, mentions: [m.sender] }, { quoted: m });
        };
        m.react = async (emoji) => {
            return await sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
        };
    }

    // --- 🔹 GESTION DES DROITS AMÉLIORÉE ---
    m.isBotAdmin = false;
    m.isSenderAdmin = false;

    if (m.isGroup) {
        try {
            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants || [];
            
            // ID propre du bot
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

            // On cherche directement par JID complet, c'est plus fiable
            const bot = participants.find(p => p.id.split(':')[0] === botJid.split(':')[0]);
            const sender = participants.find(p => p.id.split(':')[0] === m.sender.split(':')[0]);

            if (bot && (bot.admin === 'admin' || bot.admin === 'superadmin')) m.isBotAdmin = true;
            if (sender && (sender.admin === 'admin' || sender.admin === 'superadmin')) m.isSenderAdmin = true;
        } catch (e) {
            console.error("Erreur Metadata:", e);
        }
    }

    // --- 🔹 GESTION DES MESSAGES CITÉS ---
    m.quoted = null;
    const quotedContext = m.message?.extendedTextMessage?.contextInfo || m.message[m.mtype]?.contextInfo;
    
    if (quotedContext?.quotedMessage) {
        const q = quotedContext;
        m.quoted = {};
        m.quoted.id = q.stanzaId;
        m.quoted.chat = m.chat;
        m.quoted.sender = q.participant;
        m.quoted.fromMe = m.quoted.sender.split(':')[0] === sock.user.id.split(':')[0];
        m.quoted.mtype = getContentType(q.quotedMessage);
        
        m.quoted.body = q.quotedMessage?.conversation || 
                        q.quotedMessage?.extendedTextMessage?.text || 
                        q.quotedMessage[m.quoted.mtype]?.caption || 
                        q.quotedMessage[m.quoted.mtype]?.text || "";
                        
        m.quoted.delete = async () => await sock.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: m.quoted.fromMe, id: m.quoted.id, participant: m.quoted.sender } });
    }

    return m;
};
