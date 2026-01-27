const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/pair', async (req, res) => {
    let phone = req.query.phone;
    if (!phone) return res.send({ error: "Numéro requis" });
    phone = phone.replace(/[^0-9]/g, '');

    const authPath = path.join('/tmp', 'auth_' + phone);
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    
    try {
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: ["Ubuntu", "Chrome", "110.0.5481.177"],
            // --- CONFIGURATION POUR ATTENDRE 1 MINUTE ---
            connectTimeoutMs: 60000, // Attend 60s pour la connexion initiale
            defaultQueryTimeoutMs: 60000, // Attend 60s pour les réponses de WhatsApp
            keepAliveIntervalMs: 10000 // Envoie un signal toutes les 10s pour ne pas que Render s'endorme
        });

        if (!sock.authState.creds.registered) {
            await delay(3000); 
            const code = await sock.requestPairingCode(phone);
            if (!res.headersSent) res.send({ code: code });
        }

        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on("connection.update", async (s) => {
            const { connection } = s;
            
            if (connection === "open") {
                console.log("✅ Connexion réussie !");
                await delay(5000);
                const sessionID = Buffer.from(JSON.stringify(sock.authState.creds)).toString('base64');
                await sock.sendMessage(sock.user.id, { text: `OTSUTSUKI-MD_SESSION_ID_${sessionID}` });
                
                // On laisse la session active 30s de plus pour finaliser
                await delay(30000);
                try { fs.rmSync(authPath, { recursive: true, force: true }); } catch (e) {}
            }
        });

    } catch (err) {
        console.error("ERREUR:", err);
        if (!res.headersSent) res.status(500).send({ error: "Délai dépassé, réessayez." });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Augmente le timeout du serveur HTTP d'Express à 2 minutes
const server = app.listen(PORT, () => console.log(`🚀 Serveur actif sur le port ${PORT}`));
server.timeout = 120000;