const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Correction ici : On dit à Express que les fichiers (index.html, etc.) 
// sont dans le même dossier que ce script (le dossier /web)
app.use(express.static(__dirname));

app.get('/pair', async (req, res) => {
    const phone = req.query.phone;
    if (!phone) return res.send({ error: "Numéro requis" });

    // Dossier temporaire pour l'authentification
    const authPath = path.join(__dirname, 'temp_auth');
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    
    try {
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: ["Chrome (Linux)", "", ""]
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            const code = await sock.requestPairingCode(phone);
            res.send({ code: code });
        }

        sock.ev.on('creds.update', saveCreds);
        sock.ev.on("connection.update", async (s) => {
            const { connection } = s;
            if (connection === "open") {
                await delay(5000);
                // Génération de l'ID session
                const sessionID = Buffer.from(JSON.stringify(sock.authState.creds)).toString('base64');
                await sock.sendMessage(sock.user.id, { text: `OTSUTSUKI-MD_SESSION_ID_${sessionID}` });
                console.log("Session générée avec succès !");
                
                // Nettoyage après succès
                setTimeout(() => {
                    try { fs.rmSync(authPath, { recursive: true, force: true }); } catch (e) {}
                }, 10000);
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Erreur serveur" });
    }
});

// Route par défaut pour servir l'index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));