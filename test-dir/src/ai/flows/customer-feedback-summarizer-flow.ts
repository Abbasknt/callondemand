'use server';
/**
 * @fileOverview An AI agent for summarizing customer feedback and identifying key themes and areas for improvement.
 *
 * - summarizeCustomerFeedback - A function that handles the customer feedback summarization process.
 * - CustomerFeedbackSummarizerInput - The input type for the summarizeCustomerFeedback function.
 * - CustomerFeedbackSummarizerOutput - The return type for the summarizeCustomerFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const FeedbackItemSchema = z.object({
  serviceType: z.string().describe('The type of service the feedback is for (e.g., "Food Order", "Laundry Service", "E-commerce Purchase", "Flexi Errand").'),
  feedbackText: z.string().describe('The actual text content of the customer feedback.'),
  rating: z.number().min(1).max(5).optional().describe('The numerical rating given by the customer, if available (e.g., 1-5 stars).')
});

const CustomerFeedbackSummarizerInputSchema = z.object({
  feedbackItems: z.array(FeedbackItemSchema).min(1).describe('An array of individual customer feedback entries to be summarized.')
});
export type CustomerFeedbackSummarizerInput = z.infer<typeof CustomerFeedbackSummarizerInputSchema>;

// Output Schema
const CustomerFeedbackSummarizerOutputSchema = z.object({
  summary: z.string().describe('A concise overall summary of all provided customer feedback.'),
  keyThemes: z.array(z.string()).describe('A list of prominent themes or recurring topics identified across the feedback.'),
  commonIssues: z.array(z.string()).describe('A list of common problems, complaints, or negative aspects mentioned by customers.'),
  areasForImprovement: z.array(z.string()).describe('A list of actionable suggestions or areas where service quality can be enhanced based on the feedback.'),
  overallSentiment: z.enum(['Positive', 'Negative', 'Neutral', 'Mixed']).describe('The overall sentiment derived from the collection of feedback.')
});
export type CustomerFeedbackSummarizerOutput = z.infer<typeof CustomerFeedbackSummarizerOutputSchema>;

// Wrapper function
export async function summarizeCustomerFeedback(input: CustomerFeedbackSummarizerInput): Promise<CustomerFeedbackSummarizerOutput> {
  return customerFeedbackSummarizerFlow(input);
}

// Prompt definition
const prompt = ai.definePrompt({
  name: 'customerFeedbackSummarizerPrompt',
  input: {schema: CustomerFeedbackSummarizerInputSchema},
  output: {schema: CustomerFeedbackSummarizerOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing customer feedback to provide actionable insights.
Your task is to summarize a collection of customer feedback and identify key themes, common issues, and areas for improvement.
Also, determine the overall sentiment of the feedback.

Analyze the following customer feedback items:

{{#each feedbackItems}}
---
Service Type: {{{serviceType}}}
Rating: {{#if rating}}{{{rating}}} out of 5{{else}}N/A{{/if}}
Feedback: {{{feedbackText}}}
---
{{/each}}

Based on the feedback above, provide:
1. A concise overall summary.
2. A list of key themes.
3. A list of common issues.
4. A list of actionable areas for improvement.
5. The overall sentiment (Positive, Negative, Neutral, or Mixed).

Ensure your output strictly adheres to the JSON schema provided.`,
});

// Flow definition
const customerFeedbackSummarizerFlow = ai.defineFlow(
  {
    name: 'customerFeedbackSummarizerFlow',
    inputSchema: CustomerFeedbackSummarizerInputSchema,
    outputSchema: CustomerFeedbackSummarizerOutputSchema,
  },
  async (input) => {
    console.log('[customerFeedbackSummarizerFlow] Input:', JSON.stringify(input, null, 2));
    const {output} = await prompt(input);
    console.log('[customerFeedbackSummarizerFlow] Output:', JSON.stringify(output, null, 2));
    return output!;
  }
);
