import { makeWASocket, useMultiFileAuthState, DisconnectReason, jidNormalizedUser } from '@whiskeysockets/baileys';
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
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            
            // If logged out or if there's a conflict (another instance took over), we should arguably stop
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 440;
            
            console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            
            // reconnect if not logged out & not a conflict
            if (shouldReconnect) {
                startBot();
            } else if (statusCode === 440 || statusCode === DisconnectReason.loggedOut) {
                console.error("Critical disconnect (logged out or conflict). Clean auth_info folder and restart manually.");
                process.exit(1);
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

            const botJidRaw = sock.user?.id || sock.authState.creds.me?.id;
            const botLidRaw = sock.authState.creds.me?.lid;
            
            const botId = botJidRaw ? jidNormalizedUser(botJidRaw) : '';
            const botLid = botLidRaw ? jidNormalizedUser(botLidRaw) : '';
            console.log(`[DEBUG] Bot IDs resolved to: JID=${botId} LID=${botLid}`);

            // Get text content
            const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if (!messageContent) continue;

            const text = messageContent.trim().toLowerCase();
            const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];

            if (text === '!start' || text.startsWith('!start ')) {
                await handleStartCommand(sock, jid, botId, botLid, mentionedJid);
            } else if (text === '!new') {
                await handleNewCommand(sock, jid, botId, botLid);
            } else if (text === '!end') {
                await handleEndCommand(sock, jid);
            }
        }
    });
};
