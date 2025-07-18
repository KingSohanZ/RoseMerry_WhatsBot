module.exports.run = async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const torrentUrl = args[0];

    if (!torrentUrl || !torrentUrl.startsWith("https://yts.mx/torrent/download/")) {
        return sock.sendMessage(jid, { text: "❗ Invalid or missing torrent link." });
    }

    await sock.sendMessage(jid, {
        document: { url: torrentUrl },
        mimetype: "application/x-bittorrent",
        fileName: "movie.torrent",
        caption: "🎬 Download this .torrent file and open it with a torrent client like uTorrent or BitTorrent to download the movie."
    });
};
