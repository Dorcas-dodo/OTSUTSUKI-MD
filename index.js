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

async function startBot(userId = "main_admin") {
    const sessionDir = `./session_${userId}`;

    // --- LOGIQUE DE RESTAURATION VIA SESSION_ID ---
    if (!fs.existsSync(sessionDir) && process.env.SESSION_ID && userId === "main_admin") {
        console.log(`🛰️ OTSUTSUKI : Tentative de restauration de session...`);
        try {
            const sessionData = await get_session(process.env.SESSION_ID);
            if (sessionData) {
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
        browser: ["Otsutsuki-MD", "Safari", "3.0"], 
        syncFullHistory: false,
        markOnlineOnConnect: true,
    });

    activeSocks[userId] = sock;
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) currentQRs[userId] = await QRCode.toDataURL(qr);

        if (connection === 'open') {
            currentQRs[userId] = "connected";
            console.log(`🏮 OTSUTSUKI [${userId}] : Système en ligne !`);
            
            // --- GÉNÉRATION DU SESSION_ID ---
            const credsPath = `${sessionDir}/creds.json`;
            let session_id_env = "Indisponible";
            
            if (fs.existsSync(credsPath)) {
                const credsData = fs.readFileSync(credsPath);
                session_id_env = `Otsutsuki~${Buffer.from(credsData).toString('base64')}`;
            }

            const userJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            
            // --- MESSAGE DE BIENVENUE ---
            await sock.sendMessage(userJid, { 
                image: { url: "https://wallpapercave.com/wp/wp9113171.jpg" },
                caption: `✨ *⛩️ OTSUTSUKI-MD : ÉVEIL RÉUSSI* ⛩️\n\n` +
                         `🚀 *Félicitations Shinobi !*\n` +
                         `Ton identité est désormais liée au flux divin.\n\n` +
                         `📌 *TON SESSION_ID :*\n\n` +
                         `\`\`\`${session_id_env}\`\`\`\n\n` +
                         `⚠️ *INFO :* Copie ce code pour ta variable **SESSION_ID** sur Koyeb.\n\n` +
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
        if (groupUpdateHandler) await groupUpdateHandler(sock, anu);
    });

    return sock;
}

// Lancement automatique
startBot();

// --- ROUTES EXPRESS ---
app.get('/', (req, res) => {
    res.send(`<h1 style="font-family:sans-serif;text-align:center;margin-top:50px;">⛩️ OTSUTSUKI-MD : SERVEUR ACTIF ⛩️</h1>`);
});

app.get('/get-qr/:id', (req, res) => {
    res.json({ qr: currentQRs[req.params.id] || null });
});

app.listen(PORT, () => console.log("🌐 Serveur OTSUTSUKI actif sur port " + PORT));
