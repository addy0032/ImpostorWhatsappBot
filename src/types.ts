export interface GameState {
    groupId: string | null;
    players: string[];
    impostorId: string | null;
    currentWord: string | null;
    currentCategory: string | null;
    discussionOrder: string[];
    usedWords: string[];
}

export interface GroqResponse {
    word: string;
    category: string;
}
