'use server';

/**
 * @fileOverview A Genkit flow for purchasing airtime and data bundles.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ServiceTypeSchema = z.enum(['airtime', 'data']);
const ProviderSchema = z.enum(['MTN', 'Airtel', 'Glo', '9mobile']);

const AirtimeDataPurchaseInputSchema = z.object({
  phoneNumber: z.string().describe('The phone number to top up.'),
  provider: ProviderSchema.describe('Network provider.'),
  serviceType: ServiceTypeSchema.describe('Type of service: airtime or data.'),
  amount: z.number().describe('The amount to top up or price of the data bundle.'),
});

const AirtimeDataPurchaseOutputSchema = z.object({
  success: z.boolean(),
  transactionId: z.string().optional(),
  message: z.string(),
});

export type AirtimeDataPurchaseInput = z.infer<typeof AirtimeDataPurchaseInputSchema>;
export type AirtimeDataPurchaseOutput = z.infer<typeof AirtimeDataPurchaseOutputSchema>;

export const airtimeDataPurchaseFlow = ai.defineFlow(
  {
    name: 'airtimeDataPurchaseFlow',
    inputSchema: AirtimeDataPurchaseInputSchema,
    outputSchema: AirtimeDataPurchaseOutputSchema,
  },
  async (input) => {
    console.log('[airtimeDataPurchaseFlow] Input:', JSON.stringify(input, null, 2));

    // NOTE: In a real implementation, you would call the Monnify API here.
    // Ensure you have MONNIFY_API_KEY, MONNIFY_SECRET_KEY, MONNIFY_CONTRACT_CODE
    // configured in your environment variables.
    
    // Simulating API success for now
    const successfulTransaction = {
      success: true,
      transactionId: Math.random().toString(36).substring(7),
      message: `Successfully purchased ${input.serviceType} for ${input.phoneNumber} on ${input.provider}.`,
    };

    console.log('[airtimeDataPurchaseFlow] Result:', JSON.stringify(successfulTransaction, null, 2));
    return successfulTransaction;
  }
);
