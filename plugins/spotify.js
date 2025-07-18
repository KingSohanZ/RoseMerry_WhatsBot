require("dotenv").config();
const { SpotifyDL } = require("spotifydl-core");
const axios = require("axios");

const client = new SpotifyDL({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

module.exports.run = async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const url = args[0];

    if (!url || !url.includes("spotify.com/track")) {
        return sock.sendMessage(jid, {
            text: "❗ Please send a valid Spotify track URL.\n\n_Example: !spotify https://open.spotify.com/track/xxxxxxxx_"
        });
    }

    try {
        await sock.sendMessage(jid, { text: "🎵 Downloading Spotify song. Please wait..." });

        const song = await client.downloadTrack(url);
        const buffer = Buffer.from(await axios.get(song.audio.url, { responseType: "arraybuffer" }).then(res => res.data));

        await sock.sendMessage(jid, {
            audio: buffer,
            mimetype: "audio/mpeg",
            fileName: `${song.name} - ${song.artists.join(", ")}.mp3`
        });

    } catch (err) {
        console.error("Spotify Plugin Error:", err);
        sock.sendMessage(jid, { text: "❌ Failed to download the Spotify song. Make sure the URL is correct and the song is public." });
    }
};
