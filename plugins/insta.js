const axios = require("axios");

module.exports.run = async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const url = args[0];

    if (!url || !url.includes("instagram.com")) {
        return sock.sendMessage(jid, {
            text: "❗ Please provide a valid Instagram Reel link.\n\n_Example: !insta https://www.instagram.com/reel/xxxxxxxxx_"
        });
    }

    try {
        const apiUrl = `https://api.saveig.app/api/ajaxSearch`;
        const payload = new URLSearchParams({ q: url });

        const { data } = await axios.post(apiUrl, payload, {
            headers: {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "x-requested-with": "XMLHttpRequest",
            }
        });

        if (!data || !data.data || data.status !== "success") {
            return sock.sendMessage(jid, { text: "❌ Failed to download Instagram Reel." });
        }

        const results = data.data;
        const videoUrl = results.medias[0]?.url;
        const type = results.medias[0]?.type;

        if (type === "video") {
            await sock.sendMessage(jid, {
                video: { url: videoUrl },
                caption: "📥 Instagram Reel Downloaded"
            });
        } else if (type === "audio") {
            await sock.sendMessage(jid, {
                audio: { url: videoUrl },
                mimetype: "audio/mpeg",
                fileName: "insta_audio.mp3"
            });
        } else {
            return sock.sendMessage(jid, { text: "❌ Unknown media type or not a valid Reel." });
        }
    } catch (err) {
        console.error("Instagram Downloader Error:", err.message);
        sock.sendMessage(jid, { text: "⚠️ Error occurred while downloading." });
    }
};
