module.exports = async (sock, m, args, { isBotAdmin, isOwner, from }) => {
    if (!isOwner) return m.reply("❌ Seul mon Maître peut déclencher l'apocalypse.");
    if (!isBotAdmin) return m.reply("❌ Je dois être admin pour purger le groupe.");

    const metadata = await sock.groupMetadata(from);
    // On filtre pour ne pas s'auto-expulser et ne pas expulser les autres admins
    const victims = metadata.participants
        .filter(p => !p.admin && p.id !== sock.user.id.split(':')[0] + '@s.whatsapp.net')
        .map(p => p.id);

    if (victims.length === 0) return m.reply("🏮 Aucun membre faible détecté pour la purge.");

    m.reply(`🌀 *PURGE DÉMARRÉE* : ${victims.length} membres vont être exilés...`);
    
    for (let v of victims) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pause pour éviter le ban WhatsApp
        await sock.groupParticipantsUpdate(from, [v], "remove");
    }

    m.reply("✅ La dimension est désormais purifiée.");
};
