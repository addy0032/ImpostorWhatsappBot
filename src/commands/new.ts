import { WASocket, jidNormalizedUser } from '@whiskeysockets/baileys';
import { gameState } from '../gameState';
import { handleStartCommand } from './start';

import { generateWord } from '../groq';
import { shuffleArray } from '../utils/shuffle';

export const handleNewCommand = async (sock: WASocket, groupId: string, botId: string, botLid: string) => {
    
    // Check if there is an active game or at least a previous game structure
    if (!gameState.groupId || gameState.players.length === 0) {
        await sock.sendMessage(groupId, { text: "No active players found. Use !start first." });
        return;
    }

    try {
        await sock.sendMessage(groupId, { text: "🎮 Starting new round... getting word" });
        
        // We reuse the players array from the state
        const { word, category } = await generateWord(gameState.usedWords);
        
        gameState.currentWord = word;
        gameState.currentCategory = category;
        gameState.usedWords.push(word);

        // Choose Impostor
        const shuffledPlayers = shuffleArray(gameState.players);
        gameState.impostorId = shuffledPlayers[0] as string;

        // Send DMs and handle deletion for the bot itself
        for (const playerId of gameState.players) {
            
            let messageText = '';
            if (playerId === gameState.impostorId) {
                messageText = `🕵️ You are the impostor.\n\nCategory:\n${category}`;
            } else {
                messageText = `🎯 Your word:\n${word}`;
            }

            const sentMessage = await sock.sendMessage(playerId, { text: messageText });
            
            const normalizedPlayerId = jidNormalizedUser(playerId);
            const isBot = normalizedPlayerId === jidNormalizedUser(botId) || normalizedPlayerId === jidNormalizedUser(botLid);
            
            console.log(`[DEBUG] Attempting to send to ${normalizedPlayerId}. isBot? ${isBot}`);

            // Delete for me locally
            if (!isBot && sentMessage) {
                console.log(`[DEBUG] -> Executing deleteForMe for ${normalizedPlayerId}`);
                await sock.chatModify({
                    deleteForMe: {
                        deleteMedia: false,
                        key: sentMessage.key,
                        timestamp: Date.now()
                    }
                }, playerId);
            }
        }
        
        // Discussion Order
        gameState.discussionOrder = shuffleArray(gameState.players);
        
        let discussionText = '🎮 New Round Started!\n\nDiscussion Order:\n';
        for (let i = 0; i < gameState.discussionOrder.length; i++) {
            const playerNode = gameState.discussionOrder[i] as string;
            discussionText += `${i + 1}. @${playerNode.split('@')[0]}\n`;
        }

        await sock.sendMessage(groupId, { 
            text: discussionText,
            mentions: gameState.discussionOrder
        });

    } catch (error) {
        console.error("Error starting game:", error);
        await sock.sendMessage(groupId, { text: "❌ Failed to start round. Check bot logs." });
    }
};
