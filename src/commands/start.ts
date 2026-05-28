import { WASocket } from '@whiskeysockets/baileys';
import { gameState } from '../gameState';
import { generateWord } from '../groq';
import { shuffleArray } from '../utils/shuffle';

export const handleStartCommand = async (sock: WASocket, groupId: string, botId: string) => {
    
    // Fetch group participants
    const groupMetadata = await sock.groupMetadata(groupId);
    
    // Exclude the bot itself from being an imposter or getting regular message like other normal players?
    // Wait, the rule says: 3. The bot sends PRIVATE DMs to every player and to the number that the bot is running on because I will be playing too and the bot will run on my number.
    // The bot's own number is the number playing.
    
    // So all participants are players!
    const allParticipants = groupMetadata.participants.map(p => p.id);
    
    // Because I am also playing and the bot will run on my number.
    
    gameState.groupId = groupId;
    gameState.players = allParticipants;
    
    // If less than 2 people, this makes no sense
    if (gameState.players.length < 2) {
        await sock.sendMessage(groupId, { text: "Not enough players to start the game." });
        return;
    }

    try {
        await sock.sendMessage(groupId, { text: "🎮 Starting new game... getting word" });

        // Generate word and category
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
            
            // Delete for me if it's NOT the bot's own number
            // The bot's number is `botId` which usually ends in @s.whatsapp.net
            if (playerId !== botId && sentMessage) {
                // Perform delete for me LOCALLY
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
        
        // Fetch names for discussion order (requires getting them from store or contacts, but Baileys might not have it readily available without store, we can just mention their numbers, or use names if present in participant metadata)
        // Group participant list usually doesn't have the nice name. We might have to rely on numbers or mention them.
        
        let discussionText = '🎮 Round Started!\n\nDiscussion Order:\n';
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
        await sock.sendMessage(groupId, { text: "❌ Failed to start game. Check bot logs." });
    }
};
