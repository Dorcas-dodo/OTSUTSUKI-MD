const express = require('express');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore,
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const messageHandler = require('./messages.upsert');

const app = express();
// Changement ici : Priorité au port fourni par l'hébergeur, sinon 8000
const PORT = process.env.PORT || 8000; 
let currentQR = null;
let sock;

// --- INTERFACE WEB (QR + PAIR) ---
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>OTSUTSUKI-MD - CONNEXION</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { background: #0a0a0a; color: #dcdcdc; font-family: 'Segoe UI', sans-serif; text-align: center; padding: 20px; }
                    .card { background: #111; padding: 30px; border-radius: 20px; max-width: 450px; margin: auto; border: 1px solid #8e44ad; box-shadow: 0 0 15px #8e44ad; }
                    h2 { color: #8e44ad; letter-spacing: 2px; }
                    .method { background: #1a1a1a; padding: 15px; margin: 20px 0; border-radius: 12px; border: 1px solid #333; }
                    button { background: #8e44ad; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; font-size: 16px; transition: 0.3s; }
                    button:hover { background: #fff; color: #8e44ad; }
                    input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #8e44ad; background: #000; color: white; text-align: center; }
                    #qr-img { background: white; padding: 10px; margin-top: 15px; display: none; margin-left: auto; margin-right: auto; border-radius: 5px; }
                    #pair-display { font-size: 1.8em; color: #2ecc71; margin-top: 15px; font-weight: bold; letter-spacing: 3px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <img src="https://i.ibb.co/vz6mD6P/logo.png" width="80" style="border-radius: 50%;">
                    <h2>OTSUTSUKI-MD V1</h2>
                    <div class="method">
                        <p>🔹 OPTION 1 : SCANNER QR</p>
                        <button onclick="getQR()">AFFICHER LE QR CODE</button>
                        <img id="qr-img" width="220">
                    </div>
                    <div class="method">
                        <p>🔹 OPTION 2 : PAIRING CODE</p>
                        <input type="text" id="phone" placeholder="Numéro (ex: 24206xxxx)">
                        <button onclick="getPair()">GÉNÉRER MON CODE</button>
                        <div id="pair-display"></div>
                    </div>
                </div>
                <script>
                    async function getQR() {
                        const res = await fetch('/get-qr');
                        const data = await res.json();
                        if(data.qr) {
                            document.getElementById('qr-img').src = data.qr;
                            document.getElementById('qr-img').style.display = 'block';
                        } else { alert("QR non disponible. Patientez 5 sec."); }
                    }
                    async function getPair() {
                        const num = document.getElementById('phone').value;
                        if(!num) return alert("Entrez un numéro !");
                        document.getElementById('pair-display').innerText = "Attente...";
                        const res = await fetch('/pair?phone=' + num);
                        const data = await res.json();
                        document.getElementById('pair-display').innerText = data.code || data.error;
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
        browser: ["Chrome (Linux)", "Chrome", "110.0.5481.177"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) {
            currentQR = await QRCode.toDataURL(qr);
            qrcodeTerminal.generate(qr, { small: true });
        }
        if (connection === 'open') {
            currentQR = null;
            console.log("🚀 OTSUTSUKI-MD : CONNECTÉ !");
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        await messageHandler(sock, chatUpdate);
    });
}

// --- API ---
app.get('/get-qr', (req, res) => res.json({ qr: currentQR }));

app.get('/pair', async (req, res) => {
    let phone = req.query.phone;
    if (!phone) return res.json({ error: "Numéro requis" });
    try {
        const code = await sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
        res.json({ code: code });
    } catch (err) { 
        res.json({ error: "Erreur lors de la génération" }); 
    }
});

// Écoute sur le port 8000
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Serveur prêt sur le port ${PORT}`);
    startBot();
});