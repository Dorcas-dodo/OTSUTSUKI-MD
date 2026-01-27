const path = require('path');
const fs = require('fs');

module.exports = {
    name: "testmenu",
    async execute(sock, from, msg) {
        const imagePath = './media/menu.jpg';
        const audioPath = './media/menu.mp3';

        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(from, { 
                image: fs.readFileSync(imagePath), 
                caption: "✅ Image trouvée !" 
            });
        } else {
            await sock.sendMessage(from, { text: "❌ Image 'menu.jpg' manquante dans /media" });
        }

        if (fs.existsSync(audioPath)) {
            await sock.sendMessage(from, { 
                audio: fs.readFileSync(audioPath), 
                mimetype: 'audio/mp4', 
                ptt: true 
            });
        } else {
            await sock.sendMessage(from, { text: "❌ Son 'menu.mp3' manquant dans /media" });
        }
    }
};