const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const path = require('path');

const groupControl = require('./plugins/groupControl');

async function startBot() {
  const { state, saveState } = useSingleFileAuthState(path.join(__dirname, 'auth_info.json'));

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    browser: ['MyWhatsAppBot', 'Chrome', '1.0']
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('group-participants.update', async (update) => {
    await groupControl.onGroupParticipantsUpdate(sock, update);
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return; // Ignore own messages
    await groupControl.onMessageReceived(sock, msg);
  });

  console.log('✅ WhatsApp Bot started...');
}

startBot();
