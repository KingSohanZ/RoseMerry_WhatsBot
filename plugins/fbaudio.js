module.exports.run = async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const url = args[0];

    if (!url) return sock.sendMessage(jid, { text: "⚠️ Invalid video link for audio extraction." });

    // Use same video link as source
    await sock.sendMessage(jid, {
        audio: { url },
        mimetype: "audio/mpeg",
        fileName: "facebook_audio.mp3"
    });
};
