const express = require('express');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore,
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");
const fs = require('fs');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode'); // Requis pour l'affichage web

const app = express();
const PORT = process.env.PORT || 3000;
let currentQR = null;
let sock;

// --- INTERFACE WEB DOUBLE OPTION ---
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>OTSUTSUKI-MD - Connexion</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { background: #0f0c29; color: white; font-family: sans-serif; text-align: center; padding: 20px; }
                    .card { background: #16213e; padding: 20px; border-radius: 15px; max-width: 400px; margin: auto; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
                    .method { border: 1px solid #e94560; padding: 15px; margin: 15px 0; border-radius: 10px; }
                    button { background: #e94560; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold; }
                    input { width: 100%; padding: 10px; margin: 10px 0; border-radius: 5px; border: none; text-align: center; }
                    #qr-img { background: white; padding: 10px; margin-top: 10px; display: none; margin-left: auto; margin-right: auto; }
                    #code-display { font-size: 1.5em; color: #00ff00; margin-top: 10px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>OTSUTSUKI-MD V1</h2>
                    
                    <div class="method">
                        <h3>Option 1 : QR Code</h3>
                        <button onclick="getQR()">Générer le QR</button>
                        <img id="qr-img" width="200">
                    </div>

                    <div class="method">
                        <h3>Option 2 : Pairing Code</h3>
                        <input type="text" id="phone" placeholder="Numéro (ex: 24206xxxx)">
                        <button onclick="getPair()">Générer le Code</button>
                        <div id="code-display"></div>
                    </div>
                </div>

                <script>
                    async function getQR() {
                        const res = await fetch('/get-qr');
                        const data = await res.json();
                        if(data.qr) {
                            document.getElementById('qr-img').src = data.qr;
                            document.getElementById('qr-img').style.display = 'block';
                        } else { alert("QR non disponible. Attendez ou rafraîchissez."); }
                    }
                    async function getPair() {
                        const num = document.getElementById('phone').value;
                        const res = await fetch('/pair?phone=' + num);
                        const data = await res.json();
                        document.getElementById('code-display').innerText = data.code || data.error;
                    }
                </script>
            </body>
        </html>
    `);
});

// --- LOGIQUE WHATSAPP ---
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: true,
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "110.0.5481.177"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;
        if (qr) {
            currentQR = await QRCode.toDataURL(qr); // QR pour le Web
            qrcodeTerminal.generate(qr, { small: true }); // QR pour la console
        }
        if (connection === 'open') {
            currentQR = null;
            console.log("✅ Connecté !");
        }
    });
}

// --- ROUTES API ---
app.get('/get-qr', (req, res) => res.json({ qr: currentQR }));

app.get('/pair', async (req, res) => {
    let phone = req.query.phone;
    if (!phone) return res.json({ error: "Numéro requis" });
    try {
        const code = await sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
        res.json({ code: code });
    } catch { res.json({ error: "Erreur serveur" }); }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Serveur prêt sur le port ${PORT}`);
    startBot();
});