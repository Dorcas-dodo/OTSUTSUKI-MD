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
const { get_session, restaureAuth } = require('./session'); // AJOUT : Import de ton script de session

const app = express();
const PORT = process.env.PORT || 8000; 

// --- CONNEXION MONGODB ATLAS ---
const mongoURI = process.env.MONGODB_URI;
if (mongoURI) {
    mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("🍃 OTSUTSUKI-MD : Base de données connectée !"))
    .catch(err => console.error("❌ ERREUR MONGODB :", err.message));
}

// --- GESTION MULTI-SESSIONS ---
let activeSocks = {};
let currentQRs = {};

async function startBot(userId = "main_admin") {
    const sessionDir = `./session_${userId}`;

    // --- LOGIQUE DE RESTAURATION (AJOUT) ---
    // Si le dossier n'existe pas et qu'on a une variable SESSION_ID sur Koyeb
    if (!fs.existsSync(sessionDir) && process.env.SESSION_ID && userId === "main_admin") {
        console.log(`🛰️ OTSUTSUKI : Tentative de restauration de la session principale...`);
        try {
            const sessionData = await get_session(process.env.SESSION_ID); // Utilise ton session.js
            if (sessionData) {
                // Restaure les fichiers creds.json et keys dans le dossier
                await restaureAuth(`session_${userId}`, sessionData.creds, sessionData.keys);
                console.log("✅ Session restaurée avec succès !");
            }
        } catch (e) {
            console.error("⚠️ Échec de restauration auto :", e.message);
        }
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
        printQRInTerminal: userId === "main_admin",
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.0"], 
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
    });

    activeSocks[userId] = sock;
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) currentQRs[userId] = await QRCode.toDataURL(qr);

        if (connection === 'open') {
            currentQRs[userId] = "connected";
            console.log(`🏮 OTSUTSUKI [${userId}] : Système en ligne !`);
            
            // Notification de succès
            const userJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            await sock.sendMessage(userJid, { 
                image: { url: "https://wallpapercave.com/wp/wp9113171.jpg" },
                caption: `✨ *⛩️ OTSUTSUKI-MD : ÉVEIL RÉUSSI* ⛩️\n\nIdentité : *${userId}*\nStatut : Maître du Système`
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

    return sock;
}

// Lancement automatique au démarrage (pour Koyeb)
startBot();

// --- ROUTES EXPRESS --- (Gardées telles quelles pour ton interface web)
app.get('/', (req, res) => { /* Ton code HTML existant */ });
app.listen(PORT, () => console.log("🌐 Serveur actif sur port " + PORT));
