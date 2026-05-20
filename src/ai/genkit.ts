import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * @fileOverview Genkit 1.x Initialization for Call on Demand.com.
 * Uses Google AI Gemini 3 Flash for high-speed, cost-effective content generation.
 */
if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not defined in environment variables');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash', // Use a standard, supported model
});
