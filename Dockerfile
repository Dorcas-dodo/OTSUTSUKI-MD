module.exports = async (sock, m) => {
    const start = Date.now();
    await m.reply('🚀 *Analyse du Chakra...*');
    const end = Date.now();
    
    const latence = end - start;
    
    await sock.sendMessage(m.chat, { 
        text: `🏮 *𝖮𝖳𝖲𝖴𝖳𝖲𝖴𝖪𝖨 𝖲𝖯𝖤𝖤𝖣* : ${latence}𝗆𝗌`,
        edit: m.key // Si ton bot supporte l'édition, sinon laisse le reply classique
    });
};
