import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * @fileOverview Genkit 1.x Initialization for Call on Demand.com.
 * Uses Google AI Gemini 3 Flash for high-speed, cost-effective content generation.
 */
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSy_dummy_key_for_build_compatibility';

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not defined in environment variables. Using a dummy key for build/compatibility.');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey,
    }),
  ],
  model: 'googleai/gemini-3.6-flash',
});
