const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('web'));

app.get('/pair', async (req, res) => {
    const phone = req.query.phone;
    if (!phone) return res.send({ error: "Numéro requis" });

    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'temp_auth'));
    
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
            const { connection, lastDisconnect } = s;
            if (connection === "open") {
                await delay(5000);
                // Génération de l'ID (Format personnalisé pour ton bot)
                const sessionID = Buffer.from(JSON.stringify(sock.authState.creds)).toString('base64');
                await sock.sendMessage(sock.user.id, { text: `OTSUTSUKI-MD_SESSION_ID_${sessionID}` });
                console.log("Session générée avec succès !");
            }
        });

    } catch (err) {
        res.send({ error: "Erreur serveur" });
    }
});

app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));