import { WASocket } from '@whiskeysockets/baileys';
import { clearGameState } from '../gameState';

export const handleEndCommand = async (sock: WASocket, groupId: string) => {
    clearGameState();
    await sock.sendMessage(groupId, { text: "Game ended." });
};
