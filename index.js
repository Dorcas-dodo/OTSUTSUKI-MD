const express = require('express');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    makeCacheableSignalKeyStore,
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const QRCode = require('qrcode');
const messageHandler = require('./messages.upsert');
const config = require('./config');

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
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
                body { background: #050505; color: #fff; font-family: sans-serif; }
                .glass { background: rgba(20, 20, 20, 0.8); backdrop-filter: blur(10px); border: 1px solid #8e44ad; }
                .qr-box { background: white; padding: 10px; border-radius: 10px; min-height: 200px; display: flex; align-items: center; justify-content: center; }
            </style>
        </head>
        <body class="flex items-center justify-center min-h-screen">
            <div class="glass p-8 rounded-3xl w-full max-w-md text-center">
                <h1 class="text-3xl font-bold font-['Orbitron'] mb-2">OTSUTSUKI <span class="text-purple-500">MD</span></h1>
                <p class="text-gray-400 text-sm mb-6">SYSTÈME DE CONNEXION HYBRIDE</p>

                <div class="mb-8">
                    <p class="mb-3 text-sm">Scanner le QR Code :</p>
                    <div id="qr-display" class="qr-box mx-auto w-52 h-52">
                        <span class="text-black text-xs">Génération du flux...</span>
                    </div>
                </div>

                <div class="border-t border-gray-800 my-6"></div>

                <div>
                    <p class="mb-3 text-sm text-gray-400">Ou utiliser le Code de Couplage :</p>
                    <input type="text" id="phone" placeholder="24206461XXXX" class="w-full bg-black/50 border border-gray-700 p-3 rounded-lg mb-4 text-center">
                    <button onclick="getPairCode()" class="bg-purple-600 hover:bg-purple-700 w-full py-3 rounded-lg font-bold transition">Générer le Code</button>
                    <div id="pair-display" class="mt-4 text-2xl font-bold text-cyan-400 tracking-widest hidden"></div>
                </div>
            </div>

            <script>
                async function checkStatus() {
                    const res = await fetch('/get-qr');
                    const data = await res.json();
                    const qrDiv = document.getElementById('qr-display');
                    if (data.qr) {
                        qrDiv.innerHTML = '<img src="' + data.qr + '" class="w-full h-full">';
                    } else if (data.connected) {
                        qrDiv.innerHTML = '<b class="text-green-600">Connecté ✅</b>';
                    }
                }
                setInterval(checkStatus, 5000);

                async function getPairCode() {
                    const phone = document.getElementById('phone').value;
                    if (!phone) return alert("Numéro requis");
                    const res = await fetch('/pair?phone=' + phone.replace(/[^0-9]/g, ''));
                    const data = await res.json();
                    if (data.code) {
                        const disp = document.getElementById('pair-display');
                        disp.innerText = data.code;
                        disp.classList.remove('hidden');
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// --- LOGIQUE DU BOT ---
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: true,
        browser: ["Otsutsuki-MD", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        
        if (qr) currentQR = await QRCode.toDataURL(qr);

        if (connection === 'open') {
            currentQR = "connected";
            console.log("🏮 OTSUTSUKI-MD : Connecté avec succès !");

            // --- NOTIFICATION D'IDENTIFICATION ---
            const userJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const userName = sock.user.name || "Shinobi";
            
            const notifyMsg = `⛩️ *NOTIF DE DÉPLOIEMENT* ⛩️\n\n` +
                              `👤 *Nom :* ${userName}\n` +
                              `📱 *Numéro :* @${userJid.split('@')[0]}\n` +
                              `🧬 *Statut :* Session Active\n\n` +
                              `🌑 _L'oeil du Otsutsuki est désormais ouvert sur ce compte._`;

            // Envoi de la notification au compte qui vient de scanner
            await sock.sendMessage(userJid, { 
                text: notifyMsg, 
                mentions: [userJid] 
            });

            // Envoi de la notification à l'owner (si différent)
            const ownerJid = config.OWNER_NUMBER.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (userJid !== ownerJid) {
                await sock.sendMessage(ownerJid, { text: `📢 *Alerte :* Le bot a été scanné par ${userName} (${userJid.split('@')[0]})` });
            }
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

// --- ROUTES API ---
app.get('/get-qr', (req, res) => res.json({ qr: currentQR === "connected" ? null : currentQR, connected: currentQR === "connected" }));

app.get('/pair', async (req, res) => {
    let phone = req.query.phone;
    if (!phone) return res.json({ error: "No phone" });
    try {
        const code = await sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
        res.json({ code });
    } catch (err) {
        res.json({ error: "Erreur serveur" });
    }
});

app.listen(PORT, () => {
    console.log("🌐 Serveur Web sur port " + PORT);
    startBot();
});
