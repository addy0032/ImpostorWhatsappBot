import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { GroqResponse } from './types';
import { getRandomTheme } from './utils/themes';

dotenv.config();

// SET THIS FLAG:
// true = Use Groq AI | false = Use local words.json
export const USE_AI = false;

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const localWordsPath = path.join(__dirname, 'words.json');
let localWords: GroqResponse[] = [];
if (fs.existsSync(localWordsPath)) {
    localWords = JSON.parse(fs.readFileSync(localWordsPath, 'utf-8'));
}

export const generateWord = async (usedWords: string[]): Promise<GroqResponse> => {
    if (!USE_AI && localWords.length > 0) {
        // Filter out previously used words during this session
        const availableWords = localWords.filter(w => !usedWords.includes(w.word));
        
        if (availableWords.length === 0) {
            // Fallback if all words are exhausted in the session: select a random one from the whole list
            const randomIndex = Math.floor(Math.random() * localWords.length);
            return localWords[randomIndex] as GroqResponse;
        }

        // Pick a random word from the available unseen pool
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        return availableWords[randomIndex] as GroqResponse;
    }

    const model = process.env.GROQ_MODEL || 'chatgpt-oss-120b'; // Or any valid model id
    
    // We just take a random theme and prompt the model to give us a word and a category
    const theme = getRandomTheme();
    
    const prompt = `You are an expert party game designer creating prompts for an impostor-style social deduction game.

Generate:
1. One secret word.
2. One related category clue.

Audience and style:
- Keep it fun, lively, and conversation-friendly.

Hard rules:
- The secret word should be specific, concrete, and easy to talk about.
- The category clue must NOT reveal the word directly.
- The category clue should be subtle and slightly broad, so the impostor can blend in.
- Do NOT use obvious categories like “movie”, “food”, “app”, “person”, “place”, or “brand” unless the word is hard enough that the impostor still has room to fake it.
- Avoid obscure, regional, technical, outdated, or very niche references.
- Avoid words that are too generic or too famous in a way that makes the category obvious.
- Prefer words that create funny, slightly ambiguous conversation.

Output rules:
- Return ONLY valid JSON.
- No markdown.
- No extra text.
- Use exactly this format:

{
  "word": "...",
  "category": "..."
}

Quality target:
- The category should feel like a real hint a human would give in conversation, not a textbook label.
- The impostor should have a fair chance to guess the theme, but not the exact word.
`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: model,
        response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
        throw new Error("No content received from Groq.");
    }
    
    return JSON.parse(content) as GroqResponse;
};
