const config = require('../config');

module.exports = async (sock, anu) => {
    try {
        const { id, participants, action } = anu;

        // --- 1. RÉCUPÉRATION DU NUMÉRO DU BOT ---
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // --- 2. RÉCUPÉRATION DES MÉTADONNÉES DU GROUPE ---
        // Ajout d'un catch pour éviter le crash si le bot est expulsé
        const metadata = await sock.groupMetadata(id).catch(() => null);
        if (!metadata) return;
        
        // --- 3. VÉRIFICATION ROBUSTE DU STATUT ADMIN ---
        const botIsAdmin = metadata.participants.some(p => 
            p.id.split('@')[0] === botNumber.split('@')[0] && (p.admin !== null)
        );

        console.log(`🔍 [DÉBOGAGE] Groupe: ${id} | Action: ${action} | BotAdmin: ${botIsAdmin}`);

        for (let num of participants) {
            const userJid = typeof num === 'string' ? num : num.id;
            if (!userJid) continue;

            // Ignorer si c'est le bot lui-même qui rejoint (pour éviter l'auto-welcome)
            if (userJid.split('@')[0] === botNumber.split('@')[0]) continue;

            const userNumber = userJid.split("@")[0];

            // --- RÉCUPÉRATION DE LA PHOTO DE PROFIL ---
            let ppuser;
            try {
                ppuser = await sock.profilePictureUrl(userJid, 'image');
            } catch {
                ppuser = 'https://files.catbox.moe/dyox3v.jpg'; 
            }

            // --- 🟢 LOGIQUE DE BIENVENUE (WELCOME) ---
            // Correction ici : on vérifie si c'est "true" (string) OU true (boolean)
            if (action === 'add' && (config.WELCOME === 'true' || config.WELCOME === true)) {
                let welcomeText = `⛩️ *BIENVENUE CHEZ LES OTSUTSUKI* ⛩️\n\n` +
                                  `🏮 @${userNumber}, ton chakra a été détecté.\n` +
                                  `📜 *Statut du Gardien :* ${botIsAdmin ? 'Admin ✅' : 'Membre ⚠️'}\n\n` +
                                  `_Prépare-toi à l'ascension divine._`;

                await sock.sendMessage(id, {
                    text: welcomeText,
                    mentions: [userJid],
                    contextInfo: {
                        externalAdReply: {
                            title: "ＯＴＳＵＴＳＵＫＩ  ＳＵＭＭＯＮ",
                            body: "Nouveau Shinobi détecté",
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            thumbnailUrl: ppuser,
                            sourceUrl: "https://whatsapp.com/channel/0029VbAoFIMA2pL9Tv1omN2K"
                        }
                    }
                });
            } 
            
            // --- 🔴 LOGIQUE DE DÉPART (GOODBYE) ---
            // Correction ici aussi
            else if (action === 'remove' && (config.GOODBYE === 'true' || config.GOODBYE === true)) {
                let goodbyeText = `🌀 *EXIL DE LA DIMENSION* 🌀\n\n` +
                                  `Le Shinobi @${userNumber} a quitté le clan.\n` +
                                  `_L'œil céleste se ferme sur lui._`;

                await sock.sendMessage(id, {
                    text: goodbyeText,
                    mentions: [userJid],
                    contextInfo: {
                        externalAdReply: {
                            title: "ＯＴＳＵＴＳＵＫＩ  ＥＸＩＬ",
                            body: "Disparition dans le néant",
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            thumbnailUrl: ppuser,
                            sourceUrl: "https://whatsapp.com/channel/0029VbAoFIMA2pL9Tv1omN2K"
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error("❌ Erreur Event Group Update :", e);
    }
};
