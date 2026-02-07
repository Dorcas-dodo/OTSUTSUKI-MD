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
const config = require('./config');
const fs = require('fs');

// --- 🧠 LOGIQUE D'AUTH MONGODB (Plus besoin de fichier externe) ---
const AuthSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    data: { type: String, required: true }
});
const AuthModel = mongoose.models.Auth || mongoose.model('Auth', AuthSchema);

const useMongoDBAuthState = async () => {
    const writeData = async (data, id) => {
        const jsonStr = JSON.stringify(data, (key, value) => {
            if (Buffer.isBuffer(value)) return value.toString('base64');
            return value;
        });
        await AuthModel.findOneAndUpdate({ id }, { data: jsonStr }, { upsert: true });
    };
    const readData = async (id) => {
        const res = await AuthModel.findOne({ id });
        if (!res) return null;
        return JSON.parse(res.data, (key, value) => {
            if (typeof value === 'string' && /^[A-Za-z0-9+/]*={0,2}$/.test(value) && value.length > 20) {
                return Buffer.from(value, 'base64');
            }
            return value;
        });
    };
    const creds = await readData('creds') || {};
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) value = value;
                        data[id] = value;
                    }));
                    return data;
                },
                set: async (data) => {
                    for (const type in data) {
                        for (const id in data[type]) {
                            const value = data[type][id];
                            if (value) await writeData(value, `${type}-${id}`);
                            else await AuthModel.deleteOne({ id: `${type}-${id}` });
                        }
                    }
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds')
    };
};

const app = express();
const PORT = process.env.PORT || 8000; 

// --- 🍃 CONNEXION MONGODB ---
mongoose.connect(config.DATABASE_URL)
    .then(() => console.log("🍃 OTSUTSUKI-MD : Base de données connectée !"))
    .catch(err => console.error("❌ ERREUR MONGODB :", err.message));

let activeSocks = {};
let currentQRs = {};
let pairingCodes = {};

async function startBot(userId = "main_admin", usePairing = false, phoneNumber = "") {
    console.log(`📡 Initialisation de la session MongoDB pour : ${userId}`);
    
    // Utilisation de la session MongoDB au lieu du dossier local
    const { state, saveCreds } = await useMongoDBAuthState();
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"], 
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
    });

    if (usePairing && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                pairingCodes[userId] = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`🔑 Code de couplage pour ${phoneNumber} : ${pairingCodes[userId]}`);
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
            console.log(`✅ OTSUTSUKI-MD en ligne : ${sock.user.name || 'Bot'}`);
            
            const myNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            await sock.sendMessage(myNumber, { 
                text: `⛩️ *CONNEXION RÉUSSIE*\n\nTa session est désormais sauvegardée dans MongoDB. Plus besoin de SESSION_ID !` 
            });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = reason !== DisconnectReason.loggedOut;
            console.log(`❌ Connexion perdue (Raison: ${reason}). Reconnect: ${shouldReconnect}`);

            if (shouldReconnect) {
                setTimeout(() => startBot(userId), 10000);
            } else {
                console.log("❌ Déconnecté. Suppression des données en base...");
                await AuthModel.deleteMany({}); // Optionnel: efface la DB si déconnexion manuelle
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => { await messageHandler(sock, chatUpdate); });

    return sock;
}

startBot();

// --- 🌐 INTERFACE WEB ---
const HTML_HEAD = `<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { background: #0a0a0a; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }.card { background: #111; border: 2px solid #f00; padding: 30px; border-radius: 15px; text-align: center; width: 320px; box-shadow: 0 0 20px rgba(255,0,0,0.3); }h1 { color: #f00; font-size: 24px; }input { width: 100%; padding: 10px; margin: 10px 0; background: #222; border: 1px solid #444; color: #fff; border-radius: 5px; }button { width: 100%; padding: 10px; background: #f00; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }.code-display { font-size: 28px; color: #0f0; margin: 15px 0; font-family: monospace; border: 1px dashed #0f0; padding: 10px; }</style></head>`;

app.get('/', (req, res) => { res.send(`${HTML_HEAD}<div class="card"><h1>⛩️ OTSUTSUKI</h1><form action="/pair" method="get"><input type="text" name="number" placeholder="242066969267" required><button type="submit">GÉNÉRER CODE</button></form></div>`); });
app.get('/pair', async (req, res) => { 
    const num = req.query.number; 
    if (!num) return res.redirect('/'); 
    startBot("main_admin", true, num.replace(/[^0-9]/g, '')); 
    let check = 0; 
    const interval = setInterval(() => { 
        if (pairingCodes["main_admin"]) { 
            clearInterval(interval); 
            res.send(`${HTML_HEAD}<div class="card"><h2>VOTRE CODE</h2><div class="code-display">${pairingCodes["main_admin"]}</div><button onclick="window.location.href='/'">RETOUR</button></div>`); 
        } 
        if (check++ > 25) { clearInterval(interval); res.send("Délai expiré. Rafraîchissez."); } 
    }, 1000); 
});

app.listen(PORT, () => console.log("🌐 Serveur Web en ligne sur le port : " + PORT));
