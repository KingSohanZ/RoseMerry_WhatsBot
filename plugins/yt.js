const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");

module.exports.run = async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const url = args[0];

    if (!url || !ytdl.validateURL(url)) {
        return sock.sendMessage(jid, { text: "❗ Please send a valid YouTube link.\n\n_Example: !yt https://youtube.com/watch?v=xxxxxx_" });
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const thumbnail = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    // Options for user to choose
    const buttons = [
        { buttonId: `.ytvideo ${url} 360`, buttonText: { displayText: "📽️ 360p Video" }, type: 1 },
        { buttonId: `.ytvideo ${url} 720`, buttonText: { displayText: "🎥 720p Video" }, type: 1 },
        { buttonId: `.ytaudio ${url}`, buttonText: { displayText: "🎧 Audio Only" }, type: 1 },
    ];

    await sock.sendMessage(jid, {
        image: { url: thumbnail },
        caption: `🎬 *${title}*\n\nSelect a format to download:`,
        footer: "YouTube Downloader",
        buttons,
        headerType: 4
    }, { quoted: m });
};
