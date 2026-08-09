'use server';

import { adminContentGenerator as internalGenerator, type AdminContentGeneratorInput, type AdminContentGeneratorOutput } from "@/ai/flows/admin-content-generator-flow";

export async function generateAdminContent(input: AdminContentGeneratorInput): Promise<AdminContentGeneratorOutput> {
  return await internalGenerator(input);
}

export type { AdminContentGeneratorInput, AdminContentGeneratorOutput };
