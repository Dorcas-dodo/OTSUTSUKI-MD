const express = require('express');
const { 
    default: makeWASocket, 
    makeCacheableSignalKeyStore,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const messageHandler = require('./messages.upsert');
const config = require('./config');

// --- 🧠 LOGIQUE D'AUTH MONGODB ---
const AuthSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    data: { type: String, required: true }
});
const AuthModel = mongoose.models.Auth || mongoose.model('Auth', AuthSchema);

const useMongoDBAuthState = async () => {
    const writeData = async (data, id) => {
        try {
            const jsonStr = JSON.stringify(data, (key, value) => {
                if (Buffer.isBuffer(value)) return value.toString('base64');
                return value;
            });
            await AuthModel.findOneAndUpdate({ id }, { data: jsonStr }, { upsert: true });
        } catch (e) { console.error("❌ Erreur écriture MongoDB:", e); }
    };

    const readData = async (id) => {
        try {
            const res = await AuthModel.findOne({ id });
            if (!res) return null;
            return JSON.parse(res.data, (key, value) => {
                if (typeof value === 'string' && /^[A-Za-z0-9+/]*={0,2}$/.test(value) && value.length > 20) {
                    return Buffer.from(value, 'base64');
                }
                return value;
            });
        } catch (e) { return null; }
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

let currentQRs = {};
let pairingCodes = {};

async function startBot(userId = "main_admin", usePairing = false, phoneNumber = "") {
    const { state, saveCreds } = await useMongoDBAuthState();
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        logger: pino({ level: "fatal" }),
        browser: ["Otsutsuki-MD", "Safari", "2.0.0"], 
        printQRInTerminal: !usePairing, // Affiche dans le terminal si on n'utilise pas le pairing
    });

    // Demande du code de couplage
    if (usePairing && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                pairingCodes[userId] = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`🔑 Code de couplage [${phoneNumber}] : ${pairingCodes[userId]}`);
            } catch (err) { console.error("Pairing Error:", err); }
        }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        
        if (qr) {
            currentQRs[userId] = await QRCode.toDataURL(qr);
        }

        if (connection === 'open') {
            console.log(`✅ OTSUTSUKI-MD connecté !`);
            currentQRs[userId] = "connected";
            delete pairingCodes[userId];
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = reason !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                setTimeout(() => startBot(userId), 10000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => { 
        await messageHandler(sock, chatUpdate); 
    });
}

startBot();

// --- 🌐 INTERFACE WEB ---
const CSS = `<style>
    body { background: #050505; color: white; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #000; border: 1px solid #333; padding: 40px; border-radius: 20px; text-align: center; width: 350px; box-shadow: 0 0 30px rgba(255,0,0,0.1); }
    h1 { color: #f00; letter-spacing: 5px; margin-bottom: 20px; }
    .btn { display: block; width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; text-decoration: none; }
    .btn-red { background: #f00; color: white; }
    .btn-outline { background: transparent; border: 1px solid #444; color: #aaa; }
    input { width: 100%; padding: 12px; margin-bottom: 10px; background: #111; border: 1px solid #333; color: white; border-radius: 8px; box-sizing: border-box; }
    .qr-box { background: white; padding: 10px; border-radius: 10px; margin: 20px 0; display: inline-block; }
</style>`;

app.get('/', (req, res) => {
    res.send(`${CSS}
        <div class="card">
            <h1>OTSUTSUKI</h1>
            <p style="color: #666; font-size: 12px;">CHOISISSEZ VOTRE MÉTHODE</p>
            <form action="/pair" method="get">
                <input type="text" name="number" placeholder="242066969267" required>
                <button type="submit" class="btn btn-red">UTILISER PAIRING CODE</button>
            </form>
            <a href="/qr-view" class="btn btn-outline">SCANNER QR CODE</a>
        </div>`);
});

app.get('/qr-view', (req, res) => {
    if (currentQRs["main_admin"] === "connected") return res.send("<h1>Déjà connecté !</h1>");
    if (!currentQRs["main_admin"]) return res.send(`${CSS}<div class="card"><h1>PATIENTEZ...</h1><p>Le QR est en cours de génération.</p><script>setTimeout(()=>location.reload(), 3000)</script></div>`);
    
    res.send(`${CSS}
        <div class="card">
            <h1>SCANNER QR</h1>
            <div class="qr-box"><img src="${currentQRs["main_admin"]}" width="200"></div>
            <p style="color: #666;">Ouvrez WhatsApp > Appareils connectés</p>
            <a href="/" class="btn btn-outline">RETOUR</a>
        </div>`);
});

app.get('/pair', async (req, res) => {
    const num = req.query.number;
    if (!num) return res.redirect('/');
    startBot("main_admin", true, num.replace(/[^0-9]/g, ''));
    
    res.send(`${CSS}
        <div class="card">
            <h1>PAIRING CODE</h1>
            <div id="code" style="font-size: 32px; color: #0f0; margin: 20px 0; letter-spacing: 5px;">CHARGEMENT...</div>
            <p style="color: #666;">Entrez ce code sur votre téléphone</p>
            <script>
                setInterval(async () => {
                    const r = await fetch('/get-pairing-status');
                    const d = await r.json();
                    if(d.code) document.getElementById('code').innerText = d.code;
                    if(d.connected) window.location.href = '/success';
                }, 2000);
            </script>
        </div>`);
});

app.get('/get-pairing-status', (req, res) => {
    res.json({ 
        code: pairingCodes["main_admin"] || null,
        connected: currentQRs["main_admin"] === "connected"
    });
});

app.get('/success', (req, res) => res.send("<h1>✅ Connexion réussie !</h1>"));

app.listen(PORT, () => console.log("🌐 OTSUTSUKI-MD Link : http://localhost:" + PORT));
