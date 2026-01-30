const config = require('../config');

module.exports = async (sock, anu) => {
    try {
        const { id, participants, action } = anu;

        // --- 1. RÉCUPÉRATION DU NUMÉRO DU BOT (Format Propre) ---
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // --- 2. RÉCUPÉRATION DES MÉTADONNÉES DU GROUPE ---
        const metadata = await sock.groupMetadata(id);
        
        // --- 3. VÉRIFICATION ROBUSTE DU STATUT ADMIN ---
        // On compare les numéros sans les suffixes et on vérifie si .admin n'est pas nul
        const botIsAdmin = metadata.participants.some(p => 
            p.id.split('@')[0] === botNumber.split('@')[0] && (p.admin !== null)
        );

        // Log de débogage pour tes logs Koyeb
        console.log(`🔍 [DÉBOGAGE] Groupe: ${id} | Bot: ${botNumber} | Admin: ${botIsAdmin}`);

        for (let num of participants) {
            // --- SÉCURISATION DU JID ---
            const userJid = typeof num === 'string' ? num : num.id;
            if (!userJid) continue;

            const userNumber = userJid.split("@")[0];

            // --- RÉCUPÉRATION DE LA PHOTO DE PROFIL ---
            let ppuser;
            try {
                ppuser = await sock.profilePictureUrl(userJid, 'image');
            } catch {
                ppuser = 'https://telegra.ph/file/40938b819f72365269784.jpg'; 
            }

            // --- 🟢 LOGIQUE DE BIENVENUE (WELCOME) ---
            if (action === 'add' && config.WELCOME === 'true') {
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
                            sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                        }
                    }
                });
            } 
            
            // --- 🔴 LOGIQUE DE DÉPART (GOODBYE) ---
            else if (action === 'remove' && config.GOODBYE === 'true') {
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
                            sourceUrl: "https://github.com/Dorcas-dodo/OTSUTSUKI-MD"
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error("❌ Erreur Event Group Update :", e);
    }
};
