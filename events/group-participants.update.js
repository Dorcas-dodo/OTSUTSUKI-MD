const config = require('../config');

module.exports = async (sock, anu) => {
    try {
        const { id, participants, action } = anu;

        for (let num of participants) {
            // --- SÉCURISATION DU JID (Correction TypeError) ---
            // On s'assure que 'num' est bien une chaîne de caractères (JID)
            const userJid = typeof num === 'string' ? num : num.id;
            if (!userJid) continue;

            const userNumber = userJid.split("@")[0]; // Extraction sécurisée du numéro

            // --- RÉCUPÉRATION DE LA PHOTO DE PROFIL ---
            let ppuser;
            try {
                ppuser = await sock.profilePictureUrl(userJid, 'image');
            } catch {
                ppuser = 'https://telegra.ph/file/40938b819f72365269784.jpg'; // Image par défaut
            }

            // --- 🟢 LOGIQUE DE BIENVENUE (WELCOME) ---
            if (action === 'add' && config.WELCOME === 'true') {
                let welcomeText = `⛩️ *BIENVENUE CHEZ LES OTSUTSUKI* ⛩️\n\n` +
                                  `🏮 @${userNumber}, ton chakra a été détecté dans cette dimension.\n\n` +
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
                            sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                        }
                    }
                });
            } 
            
            // --- 🔴 LOGIQUE DE DÉPART (GOODBYE) ---
            else if (action === 'remove' && config.GOODBYE === 'true') {
                let goodbyeText = `🌀 *EXIL DE LA DIMENSION* 🌀\n\n` +
                                  `Le Shinobi @${userNumber} a quitté le clan.\n` +
                                  `Son nom et son chakra sont effacés des archives.\n\n` +
                                  `_L'œil céleste se ferme sur lui._`;

                await sock.sendMessage(id, {
                    text: goodbyeText,
                    mentions: [userJid],
                    contextInfo: {
                        externalAdReply: {
                            title: "ＯＴＳＵＴＳＵＫＩ  ＥＸＩＬ",
                            body: "Un membre s'est évanoui dans le néant",
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            thumbnailUrl: ppuser,
                            sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error("Erreur Event Group Update :", e);
    }
};
