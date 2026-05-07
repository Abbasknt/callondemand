'use server';
/**
 * @fileOverview A Genkit flow for administrators to audit the quality and health of the Firestore database.
 *
 * - databaseAuditor - Analyzes a collection of items and identifies missing metadata or stock issues.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DatabaseAuditorInputSchema = z.object({
  collections: z.array(z.object({
    name: z.string().describe('Name of the Firestore collection.'),
    items: z.array(z.any()).describe('The documents in this collection.')
  })).describe('The dataset to be audited by AI.')
});
export type DatabaseAuditorInput = z.infer<typeof DatabaseAuditorInputSchema>;

const DatabaseAuditorOutputSchema = z.object({
  overallHealthScore: z.number().min(0).max(100).describe('Health score from 0-100.'),
  criticalIssues: z.array(z.string()).describe('List of critical errors found (e.g. missing prices).'),
  optimizationSuggestions: z.array(z.string()).describe('AI-driven suggestions to improve listing conversion.'),
  catalogSummary: z.string().describe('A high-level overview of the current platform offerings.')
});
export type DatabaseAuditorOutput = z.infer<typeof DatabaseAuditorOutputSchema>;

export async function databaseAuditor(
  input: DatabaseAuditorInput
): Promise<DatabaseAuditorOutput> {
  try {
    return await databaseAuditorFlow(input);
  } catch (error) {
    console.error("Database Auditor Error:", error);
    return {
      overallHealthScore: 0,
      criticalIssues: ["AI Audit Pipeline Timeout"],
      optimizationSuggestions: ["Retry audit when database is less busy."],
      catalogSummary: "Audit failed."
    };
  }
}

const prompt = ai.definePrompt({
  name: 'databaseAuditorPrompt',
  input: { schema: DatabaseAuditorInputSchema },
  output: { schema: DatabaseAuditorOutputSchema },
  prompt: `You are the COD Data Quality Analyst. Your job is to audit the following Firestore collection snapshots and determine if they are production-ready.

Data Snapshot:
{{#each collections}}
Collection: {{{name}}}
Items:
{{{json items}}}
---
{{/each}}

Audit Criteria:
1. Are there items with generic or missing names?
2. Do food items have prices and descriptions?
3. Are marketplace listings categorized correctly?
4. Is the overall diversity of services sufficient for a lifestyle platform?

Provide a high-energy, professional report including a health score and actionable optimizations.`,
});

const databaseAuditorFlow = ai.defineFlow(
  {
    name: 'databaseAuditorFlow',
    inputSchema: DatabaseAuditorInputSchema,
    outputSchema: DatabaseAuditorOutputSchema,
  },
  async (input) => {
    console.log('[databaseAuditorFlow] Input:', JSON.stringify(input, null, 2));
    const { output } = await prompt(input);
    console.log('[databaseAuditorFlow] Output:', JSON.stringify(output, null, 2));
    return output!;
  }
);
