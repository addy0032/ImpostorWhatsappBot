import { GameState } from './types';

export const gameState: GameState = {
    groupId: null,
    players: [],
    impostorId: null,
    currentWord: null,
    currentCategory: null,
    discussionOrder: [],
    usedWords: []
};

export const clearGameState = () => {
    gameState.groupId = null;
    gameState.players = [];
    gameState.impostorId = null;
    gameState.currentWord = null;
    gameState.currentCategory = null;
    gameState.discussionOrder = [];
    // Note: Do not clear usedWords on !end if you want to keep them across rounds.
    // If you do, clear them here.
};
