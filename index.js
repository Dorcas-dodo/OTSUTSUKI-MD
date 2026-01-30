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
        browser: ["Ubuntu", "Chrome", "20.0.0"], 
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000
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
            
            // --- MESSAGE D'ACCUEIL ÉPIQUE ---
            await sock.sendMessage(userJid, { 
                image: { url: "https://wallpapercave.com/wp/wp9113171.jpg" },
                caption: `✨ *⛩️ OTSUTSUKI-MD : L'ÉVEIL DU RINNEGAN* ⛩️\n\n` +
                         `🚀 *Félicitations Shinobi !*\n` +
                         `L'identité *${userId}* est désormais liée au flux divin.\n\n` +
                         `🔹 *Statut :* Maître du Système\n` +
                         `🔹 *Base de données :* Scellée (MongoDB)\n` +
                         `🔹 *Hébergement :* Koyeb Cloud\n\n` +
                         `_Utilise .menu pour déployer ta puissance._`
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

// --- INTERFACE WEB ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
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
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
                body { background: #050505; color: #fff; font-family: sans-serif; }
                .glass { background: rgba(20, 20, 20, 0.8); backdrop-filter: blur(10px); border: 1px solid #8e44ad; }
            </style>
        </head>
        <body class="flex items-center justify-center min-h-screen p-4">
            <div class="glass p-8 rounded-3xl w-full max-w-lg text-center">
                <h1 class="text-2xl font-bold font-['Orbitron'] mb-6 text-purple-500 italic">SESSION : ${userId}</h1>
                <div class="mb-8">
                    <p class="text-xs uppercase text-gray-500 mb-3 tracking-widest">Option 1 : Sceau Visuel (QR)</p>
                    <div id="qr-box" class="bg-white p-2 rounded-lg inline-block mx-auto">
                        <p class="text-black p-4 text-xs animate-pulse">Chargement...</p>
                    </div>
                </div>
                <div class="border-t border-gray-800 my-6"></div>
                <div class="mb-4">
                    <p class="text-xs uppercase text-gray-500 mb-3 tracking-widest">Option 2 : Code Ninja (Couplage)</p>
                    <input type="text" id="phone" placeholder="Ex: 242068079834" class="w-full bg-black/50 border border-gray-700 p-3 rounded-lg mb-4 text-center focus:border-purple-500 outline-none text-white">
                    <button onclick="
