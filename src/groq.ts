import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { GroqResponse } from './types';
import { getRandomTheme } from './utils/themes';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export const generateWord = async (usedWords: string[]): Promise<GroqResponse> => {
    const model = process.env.GROQ_MODEL || 'chatgpt-oss-120b'; // Or any valid model id
    
    // We just take a random theme and prompt the model to give us a word and a category
    const theme = getRandomTheme();
    
    const prompt = `You are an expert party game designer. Generate a fun, highly engaging secret word and a related category clue for an impostor-style social deduction game.

Previously used words (DO NOT USE THESE): ${usedWords.join(', ')}

Your job is to generate:
1. One specific secret word.
2. One related category clue.


GOOD EXAMPLES:

"word": "Hogwarts",
"category": "School"

"word": "Lightsaber",
"category": "Weapon"

"word": "Tinder",
"category": "App"

"word": "Shrek",
"category": "Hero"

"word": "Crocs",
"category": "Footwear"

"word": "Disneyland",
"category": "Park"

"word": "Godzilla",
"category": "Monster"

"word": "Netflix",
"category": "Subscription"

### Category Rules
The category must help the impostor blend in during the conversation, but MUST NOT give the exact word away.
*   Make categories creative and conversational, not just broad genres. 
*   The categories you were giving are too obvious for the impostor to blend in, I want to make it hard for the impostor.

### Prioritize:
*   Pop culture references, iconic brands, famous characters, nostalgic topics, memes, and universally recognizable objects/people.
*   Words that are instantly recognizable by most people aged 16-30.
*   Concepts that naturally create funny, slightly ambiguous discussion opportunities.

### Avoid:
*   Obscure references, regional terms, or highly technical jargon.
*   Categories that are so generic the impostor has nothing to go on.

IMPORTANT:
Return ONLY valid JSON.
No markdown formatting (do not wrap in json).
No explanations.
No extra text.

Required format:
{
"word": "...",
"category": "..."
}
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
