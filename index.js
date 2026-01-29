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
// RÉACTIVATION : Importation du fichier de gestion des messages
const messageHandler = require('./messages.upsert');

const app = express();
const PORT = process.env.PORT || 8000; 
let currentQR = null;
let sock;

// --- INTERFACE WEB ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTSUTSUKI-MD - Connexion</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@300;500;700&display=swap');
                body { background: #050505; color: #e0e0e0; font-family: 'Rajdhani', sans-serif; min-height: 100vh; }
                .glass-card { background: rgba(15, 15, 15, 0.7); backdrop-filter: blur(15px); border-radius: 24px; border: 1px solid rgba(142, 68, 173, 0.3); }
                .btn-cyber { background: linear-gradient(45deg, #8e44ad, #2575fc); transition: all 0.3s; font-family: 'Orbitron', sans-serif; }
                .btn-cyber:hover { box-shadow: 0 0 20px rgba(142, 68, 173, 0.6); transform: translateY(-2px); }
                .loader { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #00f2fe; border-radius: 50%; animation: spin 1s linear infinite; display: none; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        </head>
        <body class="flex items-center justify-center p-6">
            <div class="glass-card w-full max-w-md p-10 text-center">
                <img src="https://raw.githubusercontent.com/Dorcas-dodo/OTSUTSUKI-MD/master/media/menu.jpg" class="rounded-full w-24 h-24 object-cover mx-auto mb-4 border-2 border-purple-500" alt="Logo">
                <h1 class="text-3xl font-bold font-['Orbitron'] text-white">OTSUTSUKI <span class="text-purple-500">MD</span></h1>
                <p class="text-xs uppercase tracking-[0.3em] text-gray-400 mb-8 mt-2">System Link V1</p>
                <div class="space-y-6">
                    <input type="text" id="phone" placeholder="24206461XXXX" class="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-center outline-none focus:border-cyan-400">
                    <button onclick="getPairCode()" id="pairBtn" class="btn-cyber w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3">
                        <span id="btnText">Générer le Code</span>
                        <div id="loader" class="loader"></div>
                    </button>
                    <div id="result-container" class="hidden mt-4">
                        <div id="pair-display" class="text-3xl font-bold text-cyan-400 tracking-[0.2em] font-['Orbitron']"></div>
                    </div>
                </div>
            </div>
            <script>
                async function getPairCode() {
                    const phone = document.getElementById('phone').value;
                    const resDiv = document.getElementById('pair-display');
                    const resCont = document.getElementById('result-container');
                    const loader = document.getElementById('loader');
                    if (!phone) return alert("Numéro requis !");
                    loader.style.display = "block";
                    try {
                        const response = await fetch('/pair?phone=' + phone.replace(/[^0-9]/g, ''));
                        const data = await response.json();
                        loader.style.display = "none";
                        if (data.code) {
                            resCont.classList.remove('hidden');
                            resDiv.innerText = data.code;
                        } else { alert("Erreur serveur"); }
                    } catch (err) { loader.style.display = "none"; alert("Serveur injoignable"); }
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
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) {
            currentQR = await QRCode.toDataURL(qr);
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

    // RÉACTIVATION : Le bot va maintenant écouter les messages entrants
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
        res.json({ error: "Erreur de génération" }); 
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Serveur prêt sur le port ${PORT}`);
    startBot();
});
