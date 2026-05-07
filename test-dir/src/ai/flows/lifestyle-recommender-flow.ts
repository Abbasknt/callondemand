
'use server';
/**
 * @fileOverview A Genkit flow for proactive lifestyle recommendations.
 * Enhanced to be catalog-aware by accepting real database listings.
 *
 * - lifestyleRecommender - A function that suggests platform services based on interests and actual catalog.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const LifestyleRecommenderInputSchema = z.object({
  interests: z.array(z.string()).describe('List of user service interests.'),
  timeOfDay: z.string().describe('Current time context (e.g., Morning, Afternoon, Evening).'),
  userName: z.string().optional().describe('The name of the user for personalization.'),
  availableCatalog: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    type: z.enum(['food', 'shop', 'laundry', 'shortlet'])
  })).optional().describe('A subset of the actual database items available.'),
});
export type LifestyleRecommenderInput = z.infer<typeof LifestyleRecommenderInputSchema>;

const LifestyleRecommenderOutputSchema = z.object({
  headline: z.string().describe('A catchy headline for the recommendation.'),
  recommendation: z.string().describe('The detailed personalized suggestion.'),
  suggestedService: z.enum(['topup', 'food', 'laundry', 'shop', 'logistics', 'shortlet']).describe('The ID of the primary service suggested.'),
  featuredItemName: z.string().optional().describe('The name of a specific item from the catalog being recommended.'),
  callToAction: z.string().describe('A persuasive button text.'),
});
export type LifestyleRecommenderOutput = z.infer<typeof LifestyleRecommenderOutputSchema>;

export async function lifestyleRecommender(
  input: LifestyleRecommenderInput
): Promise<LifestyleRecommenderOutput> {
  try {
    return await lifestyleRecommenderFlow(input);
  } catch (error) {
    console.error("Lifestyle Recommender Error (Using Fallback):", error);
    return {
      headline: `Welcome back, ${input.userName || 'Partner'}!`,
      recommendation: "Your lifestyle ecosystem is ready. Check out the latest arrivals in our Food Hub or top-up your wallet sharp-sharp.",
      suggestedService: "food",
      callToAction: "Order Now"
    };
  }
}

const prompt = ai.definePrompt({
  name: 'lifestyleRecommenderPrompt',
  input: { schema: LifestyleRecommenderInputSchema },
  output: { schema: LifestyleRecommenderOutputSchema },
  prompt: `You are the Call on Demand Personal Assistant. Your goal is to suggest the most relevant lifestyle service to a Nigerian user based on their interests, time of day, and the ACTUAL available items in our database.

Context:
User Name: {{#if userName}}{{{userName}}}{{else}}Partner{{/if}}
Interests: {{#each interests}}{{{this}}}, {{/each}}
Current Time: {{{timeOfDay}}}

{{#if availableCatalog}}
Available Catalog Highlights:
{{#each availableCatalog}}
- {{{name}}} (Category: {{{category}}}, Type: {{{type}}})
{{/each}}
{{/if}}

Services available on the platform:
- topup: Airtime & Data (Essential for connectivity)
- food: Meals from unit kitchens (Great for lunch/dinner)
- laundry: Fabric care (Best requested in the morning for pickup)
- shop: Marketplace for gadgets/essentials
- logistics: Shipping and errands
- shortlet: Luxury apartment bookings

Instructions:
1. If availableCatalog is provided, try to mention a specific item by name in your recommendation text to make it feel authentic.
2. Provide a friendly, high-energy recommendation that feels personalized and helpful. 
3. Use Nigerian English nuances where appropriate (e.g., "Sharp sharp", "Enjoyment", "Oga", "Partner").
4. Ensure the suggestedService strictly matches one of the internal IDs: topup, food, laundry, shop, logistics, shortlet.`,
});

const lifestyleRecommenderFlow = ai.defineFlow(
  {
    name: 'lifestyleRecommenderFlow',
    inputSchema: LifestyleRecommenderInputSchema,
    outputSchema: LifestyleRecommenderOutputSchema,
  },
  async (input) => {
    console.log('[lifestyleRecommenderFlow] Input:', JSON.stringify(input, null, 2));
    const { output } = await prompt(input);
    console.log('[lifestyleRecommenderFlow] Output:', JSON.stringify(output, null, 2));
    return output!;
  }
);
