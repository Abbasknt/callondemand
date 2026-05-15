import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * @fileOverview Genkit 1.x Initialization for Call on Demand.com.
 * Uses Google AI Gemini 3 Flash for high-speed, cost-effective content generation.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    }),
  ],
  model: googleAI.model('gemini-3-flash-preview'),
});
