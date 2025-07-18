module.exports.run = async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const url = args[0];
    if (!url) return sock.sendMessage(jid, { text: "❗ Invalid TikTok audio link." });

    await sock.sendMessage(jid, {
        audio: { url },
        mimetype: "audio/mpeg",
        fileName: "tiktok_audio.mp3"
    });
};
