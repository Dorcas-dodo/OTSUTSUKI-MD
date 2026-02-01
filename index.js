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
        } catch (e) { console.error("Restauration impossible :", e.message); }
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
        markOnlineOnConnect: true,
    });

    if (usePairing && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                pairingCodes[userId] = code?.match(/.{1,4}/g)?.join("-") || code;
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
            
            // Notification stylée au créateur
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
    return sock;
}

startBot();

// --- ROUTES EXPRESS ---

app.get('/', (req, res) => {
    res.send(`
        <body style="background:#000; color:#fff; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; flex-direction:column;">
            <div style="border:2px solid #f00; padding:20px; border-radius:10px; text-align:center;">
                <h1>⛩️ OTSUTSUKI-MD ⛩️</h1>
                <p>Scanner le QR ou utiliser le Code de Jumelage</p>
                <a href="/get-qr/main_admin" style="color:cyan;">➜ Voir le QR Code</a><br><br>
                <form action="/pair" method="get">
                    <input type="text" name="number" placeholder="24206xxxx" style="padding:10px; border-radius:5px; border:none;">
                    <button type="submit" style="padding:10px; background:#f00; color:#fff; border:none; border-radius:5px; cursor:pointer;">Obtenir le Code</button>
                </form>
            </div>
        </body>
    `);
});

app.get('/pair', async (req, res) => {
    const num = req.query.number;
    if (!num) return res.status(400).send("Erreur: Ajoutez le numéro dans l'URL");
    const cleanNumber = num.replace(/[^0-9]/g, '');
    
    startBot("main_admin", true, cleanNumber);

    let checkCount = 0;
    const interval = setInterval(() => {
        checkCount++;
        if (pairingCodes["main_admin"]) {
            clearInterval(interval);
            res.send(`
                <body style="background:#000; color:#fff; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;">
                    <div style="border:2px solid cyan; padding:30px; border-radius:15px; text-align:center;">
                        <h2 style="color:cyan;">VOTRE CODE DE JUMELAGE</h2>
                        <h1 style="font-size:50px; letter-spacing:5px; background:#111; padding:10px;">${pairingCodes["main_admin"]}</h1>
                        <p>Entrez ce code sur votre WhatsApp</p>
                    </div>
                </body>
            `);
        }
        if (checkCount > 15) { clearInterval(interval); res.send("Délai expiré. Rafraîchissez la page."); }
    }, 1000);
});

app.get('/get-qr/:id', (req, res) => {
    const qrData = currentQRs[req.params.id];
    if (qrData && qrData !== "connected") {
        res.send(`<body style="background:#000; display:flex; justify-content:center; align-items:center; height:100vh;"><img src="${qrData}" style="border:10px solid #fff;"/></body>`);
    } else {
        res.send("QR non disponible. Allez sur /pair pour un code.");
    }
});

app.listen(PORT, () => console.log("🌐 OTSUTSUKI actif sur " + PORT));
