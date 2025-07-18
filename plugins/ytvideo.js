const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");

module.exports.run = async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const url = args[0];
    const quality = args[1] || "360";

    if (!url || !ytdl.validateURL(url)) {
        return sock.sendMessage(jid, { text: "❌ Invalid YouTube URL." });
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[\/\\?%*:|"<>]/g, "_");
    const filePath = path.join(__dirname, `../media/${title}.mp4`);

    const stream = ytdl(url, {
        quality: quality === "720" ? "22" : "18", // 22=720p mp4, 18=360p mp4
        filter: "videoandaudio"
    });

    const file = fs.createWriteStream(filePath);
    stream.pipe(file);

    file.on("finish", async () => {
        await sock.sendMessage(jid, {
            video: { url: filePath },
            caption: `🎞️ *${title}* (${quality}p)`
        });
        fs.unlinkSync(filePath);
    });
};
