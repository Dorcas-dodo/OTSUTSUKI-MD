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
const messageHandler = require('./messages.upsert');
const groupUpdateHandler = require('./events/group-participants.update'); 
const config = require('./config');
const fs = require('fs');

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
            <title>OTSUTSUKI-MD - Éveil</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
                body { background: #050505; color: #fff; font-family: sans-serif; }
                .glass { background: rgba(20, 20, 20, 0.8); backdrop-filter: blur(10px); border: 1px solid #8e44ad; box-shadow: 0 0 20px rgba(142, 68, 173, 0.3); }
                .qr-box { background: white; padding: 10px; border-radius: 10px; min-height: 200px; display: flex; align-items: center; justify-content: center; }
                .shining { animation: glow 2s infinite alternate; }
                @keyframes glow { from { text-shadow: 0 0 5px #fff, 0 0 10px #8e44ad; } to { text-shadow: 0 0 10px #fff, 0 0 20px #8e44ad; } }
            </style>
        </head>
        <body class="flex items-center justify-center min-h-screen">
            <div class="glass p-8 rounded-3xl w-full max-w-md text-center">
                <h1 class="text-3xl font-bold font-['Orbitron'] mb-2 shining">OTSUTSUKI <span class="text-purple-500">MD</span></h1>
                <p class="text-gray-400 text-sm mb-6 tracking-widest">S Y S T È M E  D ' É V E I L</p>
                <div class="mb-8">
                    <p class="mb-3 text-xs uppercase text-gray-500">Flux de synchronisation QR</p>
                    <div id="qr-display" class="qr-box mx-auto w-52 h-52">
                        <span class="text-black text-xs animate-pulse">En attente...</span>
                    </div>
                </div>
                <div class="border-t border-gray-800 my-6"></div>
                <div>
                    <p class="mb-3 text-sm text-gray-400">Couplage par Code Ninja :</p>
                    <input type="text" id="phone" placeholder="242068079834" class="w-full bg-black/50 border border-gray-700 p-3 rounded-lg mb-4 text-center focus:outline-none focus:border-purple-500 transition">
                    <button onclick="getPairCode()" id="btn-pair" class="bg-purple-600 hover:bg-purple-700 w-full py-3 rounded-lg font-bold transition active:scale-95">Générer le Code</button>
                    <div id="pair-display" class="mt-4 text-2xl font-bold text-cyan-400 tracking-[0.3em] hidden"></div>
                </div>
            </div>
            <script>
                async function checkStatus() {
                    try {
                        const res = await fetch('/get-qr');
                        const data = await res.json();
                        const qrDiv = document.getElementById('qr-display');
                        if (data.qr) {
                            qrDiv.innerHTML = '<img src="' + data.qr + '" class="w-full h-full">';
                        } else if (data.connected) {
                            qrDiv.innerHTML = '<b class="text-green-600 text-xl font-bold italic">SYSTÈME ACTIF ✅</b>';
                        }
                    } catch (e) {}
                }
                setInterval(checkStatus, 5000);

                async function getPairCode() {
                    const phoneInput = document.getElementById('phone');
                    const btn = document.getElementById('btn-pair');
                    const phone = phoneInput.value.replace(/[^0-9]/g, '');
                    if (!phone) return alert("Numéro requis");
                    btn.innerText = "Génération...";
                    btn.disabled = true;
                    try {
                        const res = await fetch('/pair?phone=' + phone);
                        const data = await res.json();
                        if (data.code) {
                            const disp = document.getElementById('pair-display');
                            disp.innerText = data.code;
                            disp.classList.remove('hidden');
                            btn.innerText = "Code Généré";
                        } else {
                            alert("Erreur: " + (data.error || "Inconnue"));
                            btn.disabled = false;
                            btn.innerText = "Générer le Code";
                        }
                    } catch (e) {
                        alert("Erreur de connexion au serveur");
                        btn.disabled = false;
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// --- LOGIQUE DU BOT ---
async function startBot() {
    // Création du dossier session si inexistant
    if (!fs.existsSync('./session')) {
        fs.mkdirSync('./session');
    }

    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();
    
    sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: true,
        logger: pino({ level: "fatal" }),
        browser: ["Otsutsuki-MD", "Safari", "1.0.0"], 
        syncFullHistory: false,
        markOnlineOnConnect: true,
        defaultQueryTimeoutMs: undefined
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) currentQR = await QRCode.toDataURL(qr);

        if (connection === 'open') {
            currentQR = "connected";
            console.log("🏮 OTSUTSUKI-MD : Éveil du système réussi !");
            const userJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const notifyMsg = `✨ *✧━━『 ⛩️ OTSUTSUKI-MD ⛩️ 』━━✧* ✨\n\n💠 *S Y S T È M E  É V E I L L É*\n👤 *HÔTE :* \`\`\`${sock.user.name}\`\`\`\n📱 *LIGNÉE :* @${userJid.split('@')[0]}\n*© 2026 OTSUTSUKI LEGACY*`;
            
            await sock.sendMessage(userJid, { 
                text: notifyMsg,
                mentions: [userJid],
                contextInfo: {
                    externalAdReply: {
                        title: "ＯＴＳＵＴＳＵＫＩ  ＡＣＴＩＶＡＴＩＯＮ",
                        body: "Le pouvoir divin est en ligne.",
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        thumbnailUrl: config.MENU_IMG,
                        sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                    }
                }
            });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => startBot(), 5000);
            } else {
                console.log("Session déconnectée.");
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        await messageHandler(sock, chatUpdate);
    });

    sock.ev.on('group-participants.update', async (anu) => {
        await groupUpdateHandler(sock, anu);
    });
}

// --- ROUTES API ---
app.get('/get-qr', (req, res) => res.json({ qr: currentQR === "connected" ? null : currentQR, connected: currentQR === "connected" }));

app.get('/pair', async (req, res) => {
    let phone = req.query.phone;
    if (!phone) return res.json({ error: "Numéro requis" });
    if (!sock) return res.json({ error: "Système en cours de démarrage... Réessaie dans 10 secondes." });

    try {
        const code = await sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
        res.json({ code });
    } catch (err) {
        res.json({ error: "WhatsApp bloque la demande. Réessaie avec le QR Code ou change de numéro." });
    }
});

app.listen(PORT, () => {
    console.log("🌐 Serveur OTSUTSUKI sur port " + PORT);
    startBot();
});
