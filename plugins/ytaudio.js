const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");

module.exports.run = async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const url = args[0];

    if (!url || !ytdl.validateURL(url)) {
        return sock.sendMessage(jid, { text: "❌ Invalid YouTube URL." });
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[\/\\?%*:|"<>]/g, "_");
    const filePath = path.join(__dirname, `../media/${title}.mp3`);

    const stream = ytdl(url, { filter: "audioonly" });
    const file = fs.createWriteStream(filePath);
    stream.pipe(file);

    file.on("finish", async () => {
        await sock.sendMessage(jid, {
            audio: { url: filePath },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
        });
        fs.unlinkSync(filePath);
    });
};
