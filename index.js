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

    // --- 1. LOGIQUE DE RESTAURATION (Indispensable pour Koyeb) ---
    if (!fs.existsSync(sessionDir) && process.env.SESSION_ID && userId === "main_admin") {
        console.log("🛰️ Restauration de la session via SESSION_ID...");
        try {
            const sessionData = await get_session(process.env.SESSION_ID);
            if (sessionData) {
                await restaureAuth(sessionDir, sessionData.creds, sessionData.keys);
                console.log("✅ Session restaurée avec succès !");
            }
        } catch (e) { console.error("⚠️ Échec restauration :", e.message); }
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
        browser: ["Ubuntu", "Chrome", "20.0.04"], 
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
            console.log("⛩️ OTSUTSUKI-MD : Éveil réussi !");

            // --- 2. GÉNÉRATION DU SESSION_ID AUTO ---
            const credsPath = `${sessionDir}/creds.json`;
            if (fs.existsSync(credsPath)) {
                const credsData = fs.readFileSync(credsPath);
                const session_id = `Otsutsuki~${Buffer.from(credsData).toString('base64')}`;
                
                const myNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                
                // Envoi du ID à ton propre numéro pour sauvegarde
                await sock.sendMessage(myNumber, { 
                    text: `*⛩️ OTSUTSUKI-MD : SESSION GÉNÉRÉE*\n\nVoici ton ID de session à copier dans tes variables d'environnement :\n\n\`\`\`${session_id}\`\`\`\n\n_Garde ce code secret !_` 
                });
            }
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔄 Reconnexion automatique...");
                setTimeout(() => startBot(userId), 5000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => { await messageHandler(sock, chatUpdate); });
    sock.ev.on('group-participants.update', async (anu) => { if (groupUpdateHandler) await groupUpdateHandler(sock, anu); });

    return sock;
}

startBot();

// --- INTERFACE WEB ---
const HTML_HEAD = `
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { background: #0a0a0a; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #111; border: 2px solid #f00; padding: 40px; border-radius: 20px; box-shadow: 0 0 30px rgba(255, 0, 0, 0.2); text-align: center; width: 350px; }
        h1 { margin: 0 0 10px; color: #f00; letter-spacing: 2px; }
        .btn-qr { display: block; margin-top: 15px; color: #888; text-decoration: none; font-size: 14px; }
        input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #333; background: #222; color: #fff; text-align: center; }
        button { width: 100%; padding: 12px; background: #f00; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
        .code-display { font-size: 32px; color: #0f0; background: #000; padding: 15px; border-radius: 10px; border: 1px dashed #0f0; margin: 20px 0; font-family: monospace; }
    </style>
</head>`;

app.get('/', (req, res) => {
    res.send(`${HTML_HEAD}<div class="card"><h1>⛩️ OTSUTSUKI</h1><form action="/pair" method="get"><input type="text" name="number" placeholder="242068079834" required><button type="submit">PAIR CODE</button></form><a href="/get-qr/main_admin" class="btn-qr">Ou utiliser le QR Code</a></div>`);
});

app.get('/pair', async (req, res) => {
    const num = req.query.number;
    if (!num) return res.redirect('/');
    startBot("main_admin", true, num.replace(/[^0-9]/g, ''));
    let check = 0;
    const interval = setInterval(() => {
        if (pairingCodes["main_admin"]) {
            clearInterval(interval);
            res.send(`${HTML_HEAD}<div class="card"><h2>CODE</h2><div class="code-display">${pairingCodes["main_admin"]}</div><p>Entrez-le sur votre WhatsApp.</p><button onclick="window.location.href='/'">RETOUR</button></div>`);
        }
        if (check++ > 20) { clearInterval(interval); res.send("Délai expiré."); }
    }, 1000);
});

app.get('/get-qr/:id', (req, res) => {
    const qrData = currentQRs[req.params.id];
    if (qrData && qrData !== "connected") {
        res.send(`${HTML_HEAD}<div class="card"><h1>SCAN</h1><img src="${qrData}" style="width:100%; border-radius:10px;"/></div>`);
    } else { res.send("QR non disponible ou déjà connecté."); }
});

app.listen(PORT, () => console.log("🌐 Serveur OTSUTSUKI-MD : Port " + PORT));
