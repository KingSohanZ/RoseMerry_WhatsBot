const axios = require("axios");
const cheerio = require("cheerio");

module.exports.run = async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const url = args[0];

    if (!url || !url.includes("facebook.com")) {
        return sock.sendMessage(jid, {
            text: "❗ Please provide a valid Facebook video link.\n\n_Example: !facebook https://www.facebook.com/watch?v=xxxxxx_"
        });
    }

    try {
        // 1. Post request to fbdown
        const { data } = await axios.post("https://www.fbdown.net/download.php", new URLSearchParams({ URLz: url }), {
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            }
        });

        // 2. Parse HTML response
        const $ = cheerio.load(data);
        const sd = $("a[download]").first().attr("href");
        const hd = $("a[download]").eq(1).attr("href");

        // 3. Buttons
        const buttons = [
            { buttonId: `.fbhd ${hd}`, buttonText: { displayText: "📽️ HD Video" }, type: 1 },
            { buttonId: `.fbsd ${sd}`, buttonText: { displayText: "📼 SD Video" }, type: 1 },
            { buttonId: `.fbaudio ${sd}`, buttonText: { displayText: "🎧 Audio Only" }, type: 1 },
        ];

        await sock.sendMessage(jid, {
            caption: "📥 *Facebook Video Found*\nChoose a format to download:",
            footer: "Facebook Downloader",
            buttons,
            headerType: 1
        }, { quoted: m });

    } catch (err) {
        console.error("Facebook Plugin Error:", err.message);
        sock.sendMessage(jid, { text: "❌ Failed to fetch Facebook video." });
    }
};
