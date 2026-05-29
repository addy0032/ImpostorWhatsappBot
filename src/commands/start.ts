import { WASocket, jidNormalizedUser } from '@whiskeysockets/baileys';
import { gameState } from '../gameState';
import { generateWord } from '../groq';
import { shuffleArray } from '../utils/shuffle';

export const handleStartCommand = async (sock: WASocket, groupId: string, botId: string, botLid: string, mentionedJid: string[] = []) => {
    
    // Fetch group participants
    const groupMetadata = await sock.groupMetadata(groupId);
    
    // Determine the participants
    let allParticipants: string[] = [];

    // If specific people are mentioned, include only them + the bot owner
    if (mentionedJid && mentionedJid.length > 0) {
        allParticipants = [...mentionedJid];
        
        // Ensure the bot owner is always in the game, because "I am playing the game too"
        const hasBot = allParticipants.some(id => 
            jidNormalizedUser(id) === jidNormalizedUser(botId) || 
            jidNormalizedUser(id) === jidNormalizedUser(botLid)
        );
        
        if (!hasBot && botId) {
            allParticipants.push(botId);
        }
    } else {
        // If no mentions, include ALL group members
        allParticipants = groupMetadata.participants.map(p => p.id);
    }
    
    gameState.groupId = groupId;
    gameState.players = [...new Set(allParticipants)]; // Ensure no duplicates
    
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
            
            const normalizedPlayerId = jidNormalizedUser(playerId);
            const isBot = normalizedPlayerId === jidNormalizedUser(botId) || normalizedPlayerId === jidNormalizedUser(botLid);
            
            console.log(`[DEBUG] Sending to ${normalizedPlayerId}. isBot? ${isBot}`);

            // Delete for me if it's NOT the bot's own number
            if (!isBot && sentMessage) {
                console.log(`[DEBUG] -> Executing deleteForMe for ${normalizedPlayerId}`);
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
