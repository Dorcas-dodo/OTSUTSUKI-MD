const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");

const app = express();
// Koyeb utilise souvent le port 8080 ou 8000 par défaut
const PORT = process.env.PORT || 8000; 

app.use(express.static(__dirname));

app.get('/pair', async (req, res) => {
    let phone = req.query.phone;
    if (!phone) return res.send({ error: "Numéro requis" });
    phone = phone.replace(/[^0-9]/g, '');

    // Utilisation de /tmp pour les permissions d'écriture
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
            // Browser mis à jour pour une meilleure reconnaissance WhatsApp
            browser: ["Ubuntu", "Chrome", "110.0.5481.177"],
            connectTimeoutMs: 30000, 
            defaultQueryTimeoutMs: 30000,
            keepAliveIntervalMs: 10000 
        });

        if (!sock.authState.creds.registered) {
            await delay(3000); // Un peu plus de temps pour stabiliser la session
            const code =