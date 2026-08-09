'use server';

/**
 * @fileOverview A Genkit flow for purchasing airtime and data bundles via Monnify Payment Gateway.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { vendBillPayment } from '@/actions/monnify';

const ServiceTypeSchema = z.enum(['airtime', 'data']);
const ProviderSchema = z.enum(['MTN', 'Airtel', 'Glo', '9mobile']);

const AirtimeDataPurchaseInputSchema = z.object({
  phoneNumber: z.string().describe('The phone number to top up.'),
  provider: ProviderSchema.describe('Network provider.'),
  serviceType: ServiceTypeSchema.describe('Type of service: airtime or data.'),
  amount: z.number().describe('The amount to top up or price of the data bundle.'),
  productCode: z.string().optional().describe('Specific product code for data bundle if available.'),
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

    const billerCode = `${input.provider.toUpperCase()}_${input.serviceType.toUpperCase()}`;
    const productCode = input.productCode || `${input.provider.toLowerCase()}_${input.serviceType.toLowerCase()}_${input.amount}`;

    const res = await vendBillPayment({
      billerCode,
      productCode,
      amount: input.amount,
      customerId: input.phoneNumber,
      paymentReference: `VTU-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    });

    if (res && res.success) {
      return {
        success: true,
        transactionId: res.response?.transactionReference || `VTU-${Date.now()}`,
        message: `Successfully vended ${input.serviceType} of ₦${input.amount.toLocaleString()} for ${input.phoneNumber} on ${input.provider}.`,
      };
    }

    return {
      success: false,
      message: res?.error || `Failed to process ${input.serviceType} top-up for ${input.phoneNumber}.`,
    };
  }
);

