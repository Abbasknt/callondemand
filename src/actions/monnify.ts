
'use server';

import axios from 'axios';

// Standardized production keys from environment
const MONNIFY_API_KEY = process.env.NEXT_PUBLIC_MONNIFY_API_KEY || 'MK_PROD_VRXL0T3UDD';
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY; // Managed via Firebase Secrets
const MONNIFY_CONTRACT_CODE = process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE || '730430763017';
const MONNIFY_BASE_URL = MONNIFY_API_KEY.startsWith('MK_PROD_') 
  ? 'https://api.monnify.com/api' 
  : 'https://sandbox.monnify.com/api';

/**
 * Enhanced Axios error logger.
 */
function logAxiosError(error: any) {
  if (error.response) {
    console.error(`Monnify API Error [${error.response.status}] [${error.config?.method?.toUpperCase()} ${error.config?.url}]:`, JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    console.error(`Monnify Network Error: No response received`);
  } else {
    console.error('Monnify Internal Error:', error.message);
  }
}

function sanitize(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  
  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = sanitize(obj[key]);
    }
  }
  return sanitized;
}

/**
 * Extract array from Monnify's paginated content structure.
 */
function extractArray(responseBody: any): any[] {
  if (!responseBody) return [];
  if (Array.isArray(responseBody)) return responseBody;
  if (responseBody.content && Array.isArray(responseBody.content)) return responseBody.content;
  return [];
}

/**
 * Authenticates with Monnify to retrieve a Bearer Token.
 */
export async function getMonnifyToken() {
  try {
    if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) {
      console.warn('Monnify configuration is incomplete. Check NEXT_PUBLIC_MONNIFY_API_KEY and MONNIFY_SECRET_KEY environment variables.');
      return { success: false, error: 'Gateway Configuration Error' };
    }
    const authString = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');
    const { data } = await axios.post(`${MONNIFY_BASE_URL}/v1/auth/login`, { refresh: true }, {
      headers: { 
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    if (data.requestSuccessful && data.responseBody) {
      return { success: true, accessToken: String(data.responseBody.accessToken) };
    }
    return { success: false, error: data.responseMessage || 'Auth failed' };
  } catch (error: any) {
    logAxiosError(error);
    return { success: false, error: 'Gateway Auth Failed' };
  }
}

/**
 * Initializes a new transaction for wallet funding.
 */
export async function initMonnifyTransaction(params: {
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription: string;
  redirectUrl?: string;
}) {
  try {
    const auth = await getMonnifyToken();
    if (!auth.success) return auth;

    const { data } = await axios.post(`${MONNIFY_BASE_URL}/v2/transactions/init-transaction`, 
      { 
        ...params, 
        contractCode: MONNIFY_CONTRACT_CODE, 
        currencyCode: 'NGN',
        paymentMethods: ["CARD", "ACCOUNT_TRANSFER", "USSD"]
      }, 
      { 
        headers: { Authorization: `Bearer ${auth.accessToken}` },
        timeout: 20000
      }
    );
    return { success: true, response: sanitize(data.responseBody) };
  } catch (e: any) { 
    logAxiosError(e);
    return { success: false, error: 'Transaction Initialization Error' }; 
  }
}

export async function getBillersByCategory(categoryCode: string) {
  try {
    const auth = await getMonnifyToken();
    if (!auth.success) return auth;
    const { data } = await axios.get(`${MONNIFY_BASE_URL}/v1/vas/bills-payment/billers?categoryCode=${categoryCode}`, { 
      headers: { Authorization: `Bearer ${auth.accessToken}` } 
    });
    return { success: true, response: sanitize(extractArray(data.responseBody)) };
  } catch (e) { 
    logAxiosError(e); 
    return { success: false, error: 'Billers registry unreachable' }; 
  }
}

export async function getBillerProducts(billerCode: string) {
  try {
    const auth = await getMonnifyToken();
    if (!auth.success) return auth;
    const { data } = await axios.get(`${MONNIFY_BASE_URL}/v1/vas/bills-payment/biller-products?billerCode=${billerCode}`, { 
      headers: { Authorization: `Bearer ${auth.accessToken}` } 
    });
    
    const rawProducts = extractArray(data.responseBody);
    const productsWithBiller = rawProducts.map((p: any) => ({ ...p, billerCode }));
    
    return { success: true, response: sanitize(productsWithBiller) };
  } catch (e) { 
    logAxiosError(e); 
    return { success: false, error: 'Operator products unreachable' }; 
  }
}

/**
 * Vends a utility product. Aligned with production JSON schema.
 */
export async function vendBillPayment(params: {
  productCode: string;
  customerId: string;
  amount: number;
  paymentReference: string;
  billerCode: string;
  validationReference?: string;
  emailAddress?: string;
}) {
  try {
    const auth = await getMonnifyToken();
    if (!auth.success) return auth;
    
    const payload = {
      productCode: params.productCode,
      customerId: params.customerId,
      amount: params.amount,
      paymentReference: params.paymentReference,
      validationReference: params.validationReference || params.paymentReference,
      emailAddress: params.emailAddress
    };

    const { data } = await axios.post(`${MONNIFY_BASE_URL}/v1/vas/bills-payment/vend`, payload, { 
      headers: { 
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json' 
      },
      timeout: 30000 
    });
    
    if (data.requestSuccessful) {
      const body = data.responseBody;
      const status = (body?.vendStatus || body?.status || "").toUpperCase();
      
      if (status === 'FAILED' || status === 'REJECTED') {
        return { 
          success: false, 
          error: body?.description || body?.message || 'Provider rejection.' 
        };
      }
      return { success: true, response: sanitize(body) };
    }
    
    return { 
      success: false, 
      error: data.responseMessage || 'Provider rejection.' 
    };
  } catch (e: any) { 
    logAxiosError(e);
    return { success: false, error: 'Fulfillment Timeout.' }; 
  }
}

/**
 * Validates a bank account name. 
 */
export async function validateBankAccount(accountNumber: string, bankCode: string) {
  try {
    const auth = await getMonnifyToken();
    if (!auth.success) return auth;
    
    const { data } = await axios.get(`${MONNIFY_BASE_URL}/v1/disbursements/account/validate?accountNumber=${accountNumber}&bankCode=${bankCode}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      timeout: 15000
    });
    
    if (data.requestSuccessful && data.responseBody) {
      return { success: true, response: sanitize(data.responseBody) };
    }
    return { success: false, error: data.responseMessage || 'Verification rejected.' };
  } catch (error: any) { 
    logAxiosError(error);
    return { success: false, error: 'KYC service unreachable.' }; 
  }
}

/**
 * Fetches merchant wallet balance. 
 */
export async function getMerchantBalance() {
  try {
    const auth = await getMonnifyToken();
    if (!auth.success) return auth;
    
    const accountNumber = process.env.MONNIFY_WALLET_ACCOUNT || '8065933172';
    const { data } = await axios.get(`${MONNIFY_BASE_URL}/v2/disbursements/wallet-balance?accountNumber=${accountNumber}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` }
    });
    
    if (data.requestSuccessful) return { success: true, response: sanitize(data.responseBody) };
    return { success: false, error: data.responseMessage || 'Balance query failed' };
  } catch (e: any) { logAxiosError(e); return { success: false, error: 'Ledger unreachable' }; }
}

export async function getBanks() {
  try {
    const auth = await getMonnifyToken();
    if (!auth.success) return auth;
    const { data } = await axios.get(`${MONNIFY_BASE_URL}/v1/banks`, { headers: { Authorization: `Bearer ${auth.accessToken}` } });
    return { success: true, response: sanitize(extractArray(data.responseBody)) };
  } catch (e) { logAxiosError(e); return { success: false, error: 'Bank list unreachable' }; }
}

/**
 * Creates or retrieves a static virtual account for a customer.
 */
export async function getReservedAccount(params: {
  accountName: string;
  customerEmail: string;
  customerName: string;
  accountReference: string;
}) {
  try {
    const auth = await getMonnifyToken();
    if (!auth.success) return auth;

    const payload = {
      accountReference: params.accountReference,
      accountName: params.accountName,
      currencyCode: "NGN",
      contractCode: MONNIFY_CONTRACT_CODE,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      getAllAvailableBanks: true
    };

    const { data } = await axios.post(`${MONNIFY_BASE_URL}/v2/bank-transfer/reserved-accounts`, payload, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      timeout: 20000
    });

    if (data.requestSuccessful) {
      return { success: true, response: sanitize(data.responseBody) };
    }
    return { success: false, error: data.responseMessage || 'Account reservation failed' };
  } catch (e: any) {
    logAxiosError(e);
    return { success: false, error: 'Reserved account service unreachable' };
  }
}

export async function getMerchantTransactions() {
  try {
    const auth = await getMonnifyToken();
    if (!auth.success) return auth;
    const { data } = await axios.get(`${MONNIFY_BASE_URL}/v2/transactions/search?size=50`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` }
    });
    return { success: true, response: sanitize(extractArray(data.responseBody)) };
  } catch (e) { logAxiosError(e); return { success: false, error: 'Search unreachable' }; }
}

export async function searchTransactions(params: {
  customerEmail?: string;
  paymentReference?: string;
  amount?: number;
  page?: number;
  size?: number;
}) {
  try {
    const auth = await getMonnifyToken();
    if (!auth.success) return auth;
    
    let query = `?page=${params.page || 0}&size=${params.size || 50}`;
    if (params.customerEmail) query += `&customerEmail=${encodeURIComponent(params.customerEmail)}`;
    if (params.paymentReference) query += `&paymentReference=${encodeURIComponent(params.paymentReference)}`;
    if (params.amount) query += `&amount=${params.amount}`;

    const { data } = await axios.get(`${MONNIFY_BASE_URL}/v2/transactions/search${query}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      timeout: 20000
    });

    if (data.requestSuccessful) {
      return { success: true, response: sanitize(extractArray(data.responseBody)) };
    }
    return { success: false, error: data.responseMessage || 'Search failed' };
  } catch (e: any) {
    logAxiosError(e);
    return { success: false, error: 'Ledger synchronization failed' };
  }
}

export async function verifyTransaction(reference: string) {
  try {
    const auth = await getMonnifyToken();
    if (!auth.success) return auth;
    
    const { data } = await axios.get(`${MONNIFY_BASE_URL}/v2/transactions/query?paymentReference=${encodeURIComponent(reference)}`, { 
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      timeout: 15000
    });
    
    if (data.requestSuccessful) return { success: true, response: sanitize(data.responseBody) };
    return { success: false, error: data.responseMessage || 'Fulfillment lookup failed' };
  } catch (e: any) { logAxiosError(e); return { success: false, error: 'Verification Timeout' }; }
}
