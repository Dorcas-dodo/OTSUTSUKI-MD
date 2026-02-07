const express = require('express');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    makeCacheableSignalKeyStore,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const messageHandler = require('./messages.upsert');
const groupUpdateHandler = require('./events/group-participants.update'); 
const config = require('./config');
const fs = require('fs');
const { get_session, restaureAuth } = require('./session');

const app = express();
const PORT = process.env.PORT || 8000; 

// --- CONNEXION MONGODB ---
const mongoURI = process.env.MONGODB_URI;
if (mongoURI) {
    mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("🍃 OTSUTSUKI-MD : Base de données connectée !"))
    .catch(err => console.error("❌ ERREUR MONGODB :", err.message));
}

let activeSocks = {};
let currentQRs = {};
let pairingCodes = {};

async function startBot(userId = "main_admin", usePairing = false, phoneNumber = "") {
    const sessionDir = `./session_${userId}`;

    // --- NETTOYAGE AUTO SI ERREUR PRÉCÉDENTE ---
    if (usePairing && fs.existsSync(sessionDir)) {
        // On ne supprime que si on n'est pas déjà enregistré
        const credsPath = `${sessionDir}/creds.json`;
        if (fs.existsSync(credsPath)) {
            const creds = JSON.parse(fs.readFileSync(credsPath));
            if (!creds.registered) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
                console.log("🧹 Session non-enregistrée nettoyée pour nouveau Pairing.");
            }
        }
    }

    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: !usePairing,
        logger: pino({ level: "fatal" }),
        // --- IDENTITÉ STANDARD POUR ÉVITER LE REJET IPHONE ---
        browser: ["Ubuntu", "Chrome", "20.0.04"], 
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
    });

    if (usePairing && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                pairingCodes[userId] = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`🔑 NOUVEAU CODE [${userId}] : ${pairingCodes[userId]}`);
            } catch (err) { 
                console.error("Pairing Error:", err);
                pairingCodes[userId] = "ERREUR_SERVEUR";
            }
        }, 3000);
    }

    activeSocks[userId] = sock;
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) currentQRs[userId] = await QRCode.toDataURL(qr);

        if (connection === 'open') {
            currentQRs[userId] = "connected";
            delete pairingCodes[userId];
            console.log("✅ Connexion réussie !");
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔄 Reconnexion en cours...");
                startBot(userId);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => { await messageHandler(sock, chatUpdate); });
    return sock;
}

startBot();

// --- INTERFACE WEB (CSS CORRIGÉ) ---
const HTML_HEAD = `
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { background: #0a0a0a; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #111; border: 2px solid #f00; padding: 40px; border-radius: 20px; box-shadow: 0 0 30px rgba(255, 0, 0, 0.2); text-align: center; width: 350px; }
        h1 { margin: 0 0 10px; color: #f00; letter-spacing: 2px; }
        input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #333; background: #222; color: #fff; text-align: center; }
        button { width: 100%; padding: 12px; background: #f00; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
        .code-display { font-size: 32px; color: #0f0; background: #000; padding: 15px; border-radius: 10px; border: 1px dashed #0f0; margin: 20px 0; font-family: monospace; }
    </style>
</head>`;

app.get('/', (req, res) => {
    res.send(`${HTML_HEAD}<div class="card"><h1>⛩️ OTSUTSUKI</h1><form action="/pair" method="get"><input type="text" name="number" placeholder="242068079834" required><button type="submit">OBTENIR LE CODE</button></form></div>`);
});

app.get('/pair', async (req, res) => {
    const num = req.query.number;
    if (!num) return res.redirect('/');
    const cleanNumber = num.replace(/[^0-9]/g, '');
    
    // On force un redémarrage propre pour le nouveau numéro
    startBot("main_admin", true, cleanNumber);

    let checkCount = 0;
    const interval = setInterval(() => {
        if (pairingCodes["main_admin"]) {
            clearInterval(interval);
            res.send(`${HTML_HEAD}<div class="card"><h2>VOTRE CODE</h2><div class="code-display">${pairingCodes["main_admin"]}</div><p>Saisissez ce code sur votre iPhone.</p><button onclick="window.location.href='/'">RETOUR</button></div>`);
        }
        if (checkCount++ > 20) { clearInterval(interval); res.send("Délai expiré. Réessayez."); }
    }, 1000);
});

app.listen(PORT, () => console.log("🌐 Serveur actif sur le port " + PORT));
