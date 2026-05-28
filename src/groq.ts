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
    
    const prompt = `Generate a word and a simple category for a guessing game. The word should be related to the theme: "${theme}".
Return only a JSON object in this format, and absolutely nothing else:
{
  "word": "...",
  "category": "..."
}
The category should be broad enough so other people can guess the word easily, but not too broad.
Avoid obscure words.
Do not use these words, they have already been used: ${usedWords.join(', ')}
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
