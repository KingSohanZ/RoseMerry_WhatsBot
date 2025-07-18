const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const userMessageLog = {};
const mutedUsers = {}; // { groupId: { userId: timeoutId } }

module.exports = {
  name: 'groupControl',
  description: 'Group control with welcome, anti-spam, commands, and punishments',

  onGroupParticipantsUpdate: async (sock, update) => {
    const metadata = await sock.groupMetadata(update.id);
    for (const participant of update.participants) {
      if (update.action === 'add') {
        const welcomePath = path.join(__dirname, '..', config.welcomeImage);
        let imageBuffer;
        try {
          imageBuffer = fs.readFileSync(welcomePath);
        } catch {
          imageBuffer = null;
        }
        await sock.sendMessage(update.id, {
          image: imageBuffer ? imageBuffer : { url: config.welcomeImage },
          caption: `👋 Welcome @${participant.split('@')[0]} to *${metadata.subject}*!`,
          mentions: [participant]
        });
      } else if (update.action === 'remove') {
        const goodbyePath = path.join(__dirname, '..', config.goodbyeImage);
        let imageBuffer;
        try {
          imageBuffer = fs.readFileSync(goodbyePath);
        } catch {
          imageBuffer = null;
        }
        await sock.sendMessage(update.id, {
          image: imageBuffer ? imageBuffer : { url: config.goodbyeImage },
          caption: `👋 Goodbye @${participant.split('@')[0]}!`,
          mentions: [participant]
        });
      }
    }
  },

  onMessageReceived: async (sock, m) => {
    if (!m.message) return;
    const { remoteJid: groupId, participant } = m.key;
    const messageText = m.message.conversation || m.message.extendedTextMessage?.text || '';

    // Mute check: delete messages from muted users
    if (
      config.muteGroups[groupId] &&
      mutedUsers[groupId] &&
      mutedUsers[groupId][participant] &&
      !m.key.fromMe
    ) {
      await sock.sendMessage(groupId, { delete: m.key });
      return;
    }

    // Auto-react
    if (m.key.fromMe === false && groupId.endsWith('@g.us')) {
      await sock.sendMessage(groupId, { react: { text: config.autoReactEmoji, key: m.key } });
    }

    // Anti-link
    if (config.antiLink && messageText.includes('https://chat.whatsapp.com/')) {
      const isAdmin = await checkIsAdmin(sock, groupId, participant);
      if (!isAdmin) {
        await sock.sendMessage(groupId, { text: `🔗 Anti-link enabled. Removing @${participant.split('@')[0]}`, mentions: [participant] });
        await sock.groupParticipantsUpdate(groupId, [participant], 'remove');
        return;
      }
    }

    // Anti-spam
    if (config.antiSpam) {
      logUserMessage(participant, messageText);
      if (isSpam(participant)) {
        if (!mutedUsers[groupId]) mutedUsers[groupId] = {};
        if (!mutedUsers[groupId][participant]) {
          mutedUsers[groupId][participant] = setTimeout(() => {
            delete mutedUsers[groupId][participant];
          }, config.spamMuteDurationMs);

          await sock.sendMessage(groupId, {
            text: `⚠️ @${participant.split('@')[0]}, you are sending messages too fast! You have been muted for ${config.spamMuteDurationMs / 1000} seconds.`,
            mentions: [participant]
          });
        }
        await sock.sendMessage(groupId, { delete: m.key });
        return;
      }
    }

    // Auto-reply (skip commands)
    if (m.key.fromMe === false && !messageText.startsWith('.')) {
      await sock.sendMessage(groupId, { text: config.autoReplyMessage });
    }

    // Command processing
    if (messageText.startsWith('.')) {
      const args = messageText.trim().split(/\s+/);
      const cmd = args[0].toLowerCase();
      const isAdmin = await checkIsAdmin(sock, groupId, participant);

      // Commands only admins can use
      const adminCommands = ['.promote', '.demote', '.mute', '.unmute', '.lock', '.unlock'];

      if (adminCommands.includes(cmd) && !isAdmin) {
        return await sock.sendMessage(groupId, { text: `❌ Only admins can use the ${cmd} command.` });
      }

      switch (cmd) {
        case '.promote':
          if (args[1]) {
            await sock.groupParticipantsUpdate(groupId, [args[1]], 'promote');
            await sock.sendMessage(groupId, { text: `✅ Promoted ${args[1]} to admin.` });
          } else {
            await sock.sendMessage(groupId, { text: '❗ Usage: .promote @user' });
          }
          break;
        case '.demote':
          if (args[1]) {
            await sock.groupParticipantsUpdate(groupId, [args[1]], 'demote');
            await sock.sendMessage(groupId, { text: `✅ Demoted ${args[1]} from admin.` });
          } else {
            await sock.sendMessage(groupId, { text: '❗ Usage: .demote @user' });
          }
          break;
        case '.mute':
          config.muteGroups[groupId] = true;
          await sock.sendMessage(groupId, { text: '🔇 Group has been muted.' });
          break;
        case '.unmute':
          config.muteGroups[groupId] = false;
          await sock.sendMessage(groupId, { text: '🔊 Group has been unmuted.' });
          break;
        case '.lock':
          await sock.groupSettingUpdate(groupId, 'announcement');
          await sock.sendMessage(groupId, { text: '🔒 Group is now locked. Only admins can send messages.' });
          break;
        case '.unlock':
          await sock.groupSettingUpdate(groupId, 'not_announcement');
          await sock.sendMessage(groupId, { text: '🔓 Group is now unlocked. Everyone can send messages.' });
          break;
        case '.groupstats':
          const meta = await sock.groupMetadata(groupId);
          const total = meta.participants.length;
          const admins = meta.participants.filter(p => p.admin !== null).length;
          await sock.sendMessage(groupId, {
            text: `📊 *Group Stats*\n\n👥 Total members: ${total}\n🛡️ Admins: ${admins}`
          });
          break;
      }
    }
  }
};

function logUserMessage(user, msg) {
  if (!userMessageLog[user]) userMessageLog[user] = [];
  const now = Date.now();
  userMessageLog[user].push(now);
  userMessageLog[user] = userMessageLog[user].filter(ts => now - ts < config.spamInterval);
}

function isSpam(user) {
  return userMessageLog[user] && userMessageLog[user].length > config.spamThreshold;
}

async function checkIsAdmin(sock, groupId, userJid) {
  const metadata = await sock.groupMetadata(groupId);
  const participant = metadata.participants.find(p => p.id === userJid);
  return participant?.admin !== null && participant?.admin !== undefined;
}
