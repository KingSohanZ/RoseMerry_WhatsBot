module.exports.run = async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const url = args[0];

    if (!url) return sock.sendMessage(jid, { text: "⚠️ Invalid SD link." });

    await sock.sendMessage(jid, {
        video: { url },
        caption: "📼 Facebook SD Video"
    });
};
