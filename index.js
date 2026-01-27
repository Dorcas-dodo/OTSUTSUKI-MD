const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const fs = require('fs');
const pako = require('pako');
const config = require('./config');

async function authOtsutsuki() {
    // Si le dossier session n'existe pas et qu'une SESSION_ID est fournie
    if (!fs.existsSync('./session/creds.json') && config.SESSION_ID) {
        console.log("💿 Restauration de la session via SESSION_ID...");
        try {
            // Décodage de la session (Base64)
            const decodedData = Buffer.from(config.SESSION_ID.split('OTSUTSUKI-MD_')[1], 'base64');
            const sessionFolder = './session';
            
            if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder);
            
            // Écriture du fichier de connexion
            fs.writeFileSync(path.join(sessionFolder, 'creds.json'), decodedData);
            console.log("✅ Session restaurée avec succès !");
        } catch (e) {
            console.error("❌ Erreur lors du décodage de la SESSION_ID. Vérifie ton code.");
        }
    }

    const { state, saveCreds } = await useMultiFileAuthState('session');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: require('pino')({ level: 'silent' }),
        browser: ["OTSUTSUKI-MD", "Safari", "3.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log("🚀 OTSUTSUKI-MD est connecté via Session !");
        }
    });
}

authOtsutsuki();