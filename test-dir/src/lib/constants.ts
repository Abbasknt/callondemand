/**
 * Global constants for the Call on Demand.com application.
 */

export const CALLONDEMAND_DOMAIN = 'callondemandbiz.com';

// Monnify Bank Codes Mapping for Name Inquiry
export const BANK_CODES: Record<string, string> = {
  "Access Bank": "044",
  "Zenith Bank": "057",
  "Guaranty Trust Bank (GTB)": "058",
  "First Bank of Nigeria": "011",
  "United Bank for Africa (UBA)": "033",
  "Fidelity Bank": "070",
  "Stanbic IBTC Bank": "221",
  "Union Bank": "032",
  "Sterling Bank": "232",
  "Wema Bank": "035",
  "Ecobank Nigeria": "050",
  "Polaris Bank": "076",
  "Kuda Bank": "50211",
  "Opay": "999992"
};

export const NIGERIAN_BANKS = Object.keys(BANK_CODES).sort();

/**
 * Production Security: Cloud KMS Resource Path
 */
export const COD_KMS_RESOURCE_ID = "projects/call-on-demand-79718192-79822/locations/global/keyRings/cod-production-ring/cryptoKeys/master-encryption-key";
