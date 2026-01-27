const axios = require('axios');

module.exports = {
    name: "attp",
    async execute(sock, from, msg, args, config) {
        if (!args[0]) return sock.sendMessage(from, { text: "Donne-moi un texte !" });
        
        const text = args.join(" ");
        const url = `https://api.vreden.my.id/api/attp?text=${encodeURIComponent(text)}`;
        
        await sock.sendMessage(from, { 
            sticker: { url: url },
            packname: config.STICKER_PACK_NAME,
            author: config.STICKER_AUTHOR_NAME
        });
    }
};