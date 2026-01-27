const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/pair', async (req, res) => {
    const phone = req.query.phone;
    if (!phone) return res.send({ error: "Numéro requis" });

    // MODIFICATION ICI : Utilisation de /tmp pour les permissions Render
    const authPath = path.join('/tmp', 'otsutsuki_auth_' + Date.now());
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    
    try {
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"]
        });

        if (!sock.authState.creds.registered) {
            await delay(2000); // Un peu plus de délai pour Render
            const code = await sock.requestPairingCode(phone);
            if (!res.headersSent) res.send({ code: code });
        }

        sock.ev.on('creds.update', saveCreds);
        sock.ev.on("connection.update", async (s) => {
            const { connection, lastDisconnect } = s;
            
            if (connection === "open") {
                await delay(5000);
                const sessionID = Buffer.from(JSON.stringify(sock.authState.creds)).toString('base64');
                await sock.sendMessage(sock.user.id, { text: `OTSUTSUKI-MD_SESSION_ID_${sessionID}` });
                console.log("✅ Session générée avec succès !");
                
                // Nettoyage automatique
                setTimeout(() => {
                    try { fs.rmSync(authPath, { recursive: true, force: true }); } catch (e) {}
                }, 10000);
            }

            // Si la connexion échoue, on log l'erreur pour voir le problème
            if (connection === "close") {
                console.log("❌ Connexion fermée. Raison possible : Code expiré ou mauvais numéro.");
            }
        });

    } catch (err) {
        console.error("ERREUR SERVEUR:", err);
        if (!res.headersSent) res.status(500).send({ error: "Erreur serveur" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));