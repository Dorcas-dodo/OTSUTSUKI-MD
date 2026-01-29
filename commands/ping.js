module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const start = Date.now();
    
    await sock.sendMessage(from, { text: "Calcul de la latence..." });
    
    const end = Date.now();
    await sock.sendMessage(from, { 
        text: `🚀 *Pong !*\n\nLatence : *${end - start}ms*\nSystème : *OTSUTSUKI-MD*` 
    });
};
