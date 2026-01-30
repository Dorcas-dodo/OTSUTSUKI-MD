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

const app = express();
const PORT = process.env.PORT || 8000; 

// --- CONNEXION MONGODB ATLAS ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("🍃 OTSUTSUKI-MD : Base de données connectée !"))
    .catch(err => console.error("❌ Erreur MongoDB :", err));

// --- GESTION MULTI-SESSIONS ---
let activeSocks = {};
let currentQRs = {};

async function startBot(userId = "main_admin") {
    // Dossier temporaire pour Baileys
    const sessionDir = `./session_${userId}`;
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: userId === "main_admin",
        logger: pino({ level: "fatal" }),
        browser: ["Otsutsuki-MD", "Safari", "1.0.0"], 
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    activeSocks[userId] = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        
        if (qr) currentQRs[userId] = await QRCode.toDataURL(qr);

        if (connection === 'open') {
            currentQRs[userId] = "connected";
            console.log(`🏮 OTSUTSUKI [${userId}] : Système en ligne !`);
            
            const userJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            await sock.sendMessage(userJid, { 
                text: `✨ *⛩️ OTSUTSUKI-MD : ÉVEIL RÉUSSI* ⛩️\n\n👤 ID : ${userId}\n✅ Session sécurisée sur MongoDB Atlas.`
            });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => startBot(userId), 5000);
            } else {
                delete activeSocks[userId];
                if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true });
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        await messageHandler(sock, chatUpdate);
    });

    sock.ev.on('group-participants.update', async (anu) => {
        await groupUpdateHandler(sock, anu);
    });

    return sock;
}

// --- INTERFACE WEB "NINJA" ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTSUTSUKI-MD - Éveil</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
                body { background: #050505; color: #fff; font-family: sans-serif; }
                .glass { background: rgba(20, 20, 20, 0.8); backdrop-filter: blur(10px); border: 1px solid #8e44ad; }
                .shining { animation: glow 2s infinite alternate; }
                @keyframes glow { from { text-shadow: 0 0 5px #fff, 0 0 10px #8e44ad; } to { text-shadow: 0 0 10px #fff, 0 0 20px #8e44ad; } }
            </style>
        </head>
        <body class="flex items-center justify-center min-h-screen">
            <div class="glass p-8 rounded-3xl w-full max-w-md text-center">
                <h1 class="text-3xl font-bold font-['Orbitron'] mb-2 shining">OTSUTSUKI <span class="text-purple-500">MD</span></h1>
                <p class="text-gray-400 text-sm mb-6 tracking-widest uppercase">Système Multi-Sessions</p>
                <div class="mb-6">
                    <input type="text" id="username" placeholder="Entrez votre nom ninja" class="w-full bg-black/50 border border-gray-700 p-3 rounded-lg mb-4 text-center focus:border-purple-500 outline-none">
                    <button onclick="goToConnect()" class="bg-purple-600 hover:bg-purple-700 w-full py-3 rounded-lg font-bold transition">Démarrer l'éveil</button>
                </div>
            </div>
            <script>
                function goToConnect() {
                    const name = document.getElementById('username').value.trim();
                    if (!name) return alert("Nom requis !");
                    window.location.href = '/connect/' + name;
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/connect/:id', (req, res) => {
    const userId = req.params.id;
    if (!activeSocks[userId]) startBot(userId);

    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <script src="https://cdn.tailwindcss.com"></script>
            <title>Connexion - ${userId}</title>
        </head>
        <body class="bg-black text-white flex flex-col items-center justify-center min-h-screen">
            <div class="bg-gray-900 p-8 rounded-2xl border border-purple-500 text-center">
                <h1 class="text-xl mb-4">Utilisateur : <span class="text-purple-400 font-bold">${userId}</span></h1>
                <div id="qr-box" class="bg-white p-2 rounded-lg inline-block">
                    <p class="text-black p-4">Chargement du flux divin...</p>
                </div>
                <p class="mt-4 text-gray-400 text-sm">Scannez le QR Code pour lier votre bot.</p>
                <a href="/" class="block mt-6 text-purple-500 text-xs">Retour à l'accueil</a>
            </div>
            <script>
                async function updateQR() {
                    try {
                        const res = await fetch('/get-qr/${userId}');
                        const data = await res.json();
                        const box = document.getElementById('qr-box');
                        if (data.qr === "connected") {
                            box.innerHTML = '<div class="p-8 text-green-600 font-bold">SYSTÈME ACTIF ✅</div>';
                        } else if (data.qr) {
                            box.innerHTML = '<img src="' + data.qr + '" class="w-64 h-64">';
                        }
                    } catch (e) {}
                }
                setInterval(updateQR, 5000);
            </script>
        </body>
        </html>
    `);
});

// --- ROUTES API ---
app.get('/get-qr/:id', (req, res) => {
    res.json({ qr: currentQRs[req.params.id] || null });
});

app.listen(PORT, () => {
    console.log("🌐 Serveur OTSUTSUKI-MD actif sur port " + PORT);
});
