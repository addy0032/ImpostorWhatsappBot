import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as path from 'path';
import qrcode from 'qrcode-terminal';

import { handleStartCommand } from './commands/start';
import { handleNewCommand } from './commands/new';
import { handleEndCommand } from './commands/end';

const authStorePath = path.join(process.cwd(), 'auth_info');

export const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(authStorePath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: require('pino')({ level: 'error' }) // Show errors only
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('QR Code received, please scan it:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            
            // reconnect if not logged out
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;

            const jid = msg.key.remoteJid;
            if (!jid || !jid.endsWith('@g.us')) continue; // Only listen in groups

            const botId = sock.user?.id.split(':')[0] + '@s.whatsapp.net';

            // Get text content
            const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if (!messageContent) continue;

            const text = messageContent.trim().toLowerCase();

            if (text === '!start') {
                await handleStartCommand(sock, jid, botId);
            } else if (text === '!new') {
                await handleNewCommand(sock, jid, botId);
            } else if (text === '!end') {
                await handleEndCommand(sock, jid);
            }
        }
    });
};
