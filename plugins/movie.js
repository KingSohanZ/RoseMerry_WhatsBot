const axios = require("axios");

module.exports.run = async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const query = args.join(" ");

    if (!query) {
        return sock.sendMessage(jid, {
            text: "🎬 Please provide a movie name to search.\n\n_Example: !movie Avengers Endgame_"
        });
    }

    try {
        const res = await axios.get(`https://yts.mx/api/v2/list_movies.json?limit=1&query_term=${encodeURIComponent(query)}`);
        const movie = res.data.data.movies?.[0];

        if (!movie) {
            return sock.sendMessage(jid, { text: "❌ Movie not found. Try a different name." });
        }

        const { title, year, medium_cover_image, torrents } = movie;

        // Quality buttons
        const buttons = torrents.map(t => ({
            buttonId: `.getmovie ${t.url}`,
            buttonText: { displayText: `🎥 ${t.quality} ${t.type}` },
            type: 1
        }));

        await sock.sendMessage(jid, {
            image: { url: medium_cover_image },
            caption: `🎬 *${title}* (${year})\n\n📥 Select a download quality below:`,
            footer: "YTS Movie Downloader",
            buttons,
            headerType: 4
        }, { quoted: m });

    } catch (err) {
        console.error("Movie Plugin Error:", err.message);
        sock.sendMessage(jid, { text: "⚠️ Failed to fetch movie info. Try again later." });
    }
};
