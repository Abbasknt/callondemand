'use server';

import { administratorRegisterUser as internalRegister, type AdministratorRegisterUserInput, type AdministratorRegisterUserOutput } from "@/ai/flows/administrator-register-user-flow";

export async function registerUserByAdmin(input: AdministratorRegisterUserInput): Promise<AdministratorRegisterUserOutput> {
  return await internalRegister(input);
}

export type { AdministratorRegisterUserInput, AdministratorRegisterUserOutput };
