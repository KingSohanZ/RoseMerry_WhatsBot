const axios = require("axios");

module.exports.run = async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const url = args[0];

    if (!url || !url.includes("tiktok.com")) {
        return sock.sendMessage(jid, { text: "❗ Please send a valid TikTok video URL.\n\n_Example: !tiktok https://vm.tiktok.com/xxxxx_" });
    }

    try {
        const api = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(api);

        if (data.code !== 0) {
            return sock.sendMessage(jid, { text: "❌ Failed to fetch TikTok video." });
        }

        const result = data.data;
        const buttons = [
            { buttonId: `.ttnowm ${result.play}`, buttonText: { displayText: "🎬 Without Watermark" }, type: 1 },
            { buttonId: `.ttwm ${result.wmplay}`, buttonText: { displayText: "🎥 With Watermark" }, type: 1 },
            { buttonId: `.ttmp3 ${result.music}`, buttonText: { displayText: "🎧 Audio Only" }, type: 1 },
        ];

        await sock.sendMessage(jid, {
            image: { url: result.cover },
            caption: `🎵 *${result.title || "TikTok Video"}*\n👤 ${result.author.nickname}\n\nChoose a format below:`,
            footer: "TikTok Downloader",
            buttons,
            headerType: 4
        }, { quoted: m });

    } catch (err) {
        console.error("TikTok plugin error:", err);
        return sock.sendMessage(jid, { text: "❌ Error occurred while downloading." });
    }
};
