
'use server';

import { lifestyleRecommender as internalRecommender, type LifestyleRecommenderInput, type LifestyleRecommenderOutput } from "@/ai/flows/lifestyle-recommender-flow";

/**
 * Server action to wrap the Genkit lifestyle recommender flow.
 * This ensures Genkit is never bundled into the client-side code.
 */
export async function getLifestyleRecommendation(input: LifestyleRecommenderInput): Promise<LifestyleRecommenderOutput> {
  return await internalRecommender(input);
}
