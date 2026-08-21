import crypto from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not defined in environment variables");
  }
  return key;
}

export interface PaystackBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
}

export interface PaystackInitializeOptions {
  email: string;
  amount: number; // in Kobo
  callbackUrl?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
  reference?: string;
  subaccount?: string;
  bearer?: "account" | "subaccount";
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/**
 * Fetch supported bank list from Paystack
 */
export async function getPaystackBanks(): Promise<PaystackBank[]> {
  const secretKey = getSecretKey();

  const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch bank list: ${error}`);
  }

  const json = await response.json();
  return json.data || [];
}

/**
 * Resolve / Verify Nigerian bank account number
 */
export async function resolvePaystackAccount(
  accountNumber: string,
  bankCode: string,
): Promise<{ account_number: string; account_name: string; bank_id?: number }> {
  const secretKey = getSecretKey();

  const cleanAccountNumber = accountNumber.trim();
  const cleanBankCode = bankCode.trim();

  const url = `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${encodeURIComponent(
    cleanAccountNumber,
  )}&bank_code=${encodeURIComponent(cleanBankCode)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();
  let json: {
    status: boolean;
    message: string;
    data?: { account_number: string; account_name: string; bank_id?: number };
  };

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      `Paystack account lookup failed (${response.status}): ${text.slice(0, 100)}`,
    );
  }

  if (!response.ok || !json.status || !json.data) {
    throw new Error(
      json.message ||
        `Could not resolve account with number ${cleanAccountNumber} and bank code ${cleanBankCode}`,
    );
  }

  return json.data;
}

export const resolveAccount = resolvePaystackAccount;

/**
 * Checks if a subaccount already exists on Paystack for a given bank and account number
 */
export async function findExistingPaystackSubaccount(
  bankCode: string,
  accountNumber: string,
): Promise<{ subaccountCode: string; id: number } | null> {
  try {
    const secretKey = getSecretKey();
    const response = await fetch(`${PAYSTACK_BASE_URL}/subaccount?perPage=100`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const json = await response.json();
    if (json.status && Array.isArray(json.data)) {
      const match = json.data.find(
        (sub: any) => String(sub.account_number).trim() === String(accountNumber).trim(),
      );

      if (match) {
        return {
          subaccountCode: match.subaccount_code,
          id: match.id,
        };
      }
    }
  } catch (err) {
    console.warn("Could not query existing Paystack subaccounts:", err);
  }
  return null;
}

/**
 * Create or update a Paystack Subaccount with a flat 5% Orbit platform fee
 */
export async function createOrUpdatePaystackSubaccount(params: {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  subaccountCode?: string | null;
  percentageCharge?: number; // Defaults to 5% Orbit platform cut
}): Promise<{ subaccountCode: string; id: number }> {
  const secretKey = getSecretKey();
  const percentageCharge = params.percentageCharge ?? 5;

  // 1. If not an explicit update, check if Paystack already has a subaccount for this bank account
  if (!params.subaccountCode) {
    const existing = await findExistingPaystackSubaccount(params.bankCode, params.accountNumber);
    if (existing) {
      return existing;
    }
  }

  const payload = {
    business_name: params.businessName,
    settlement_bank: params.bankCode,
    account_number: params.accountNumber,
    percentage_charge: percentageCharge,
    description: `Orbit Platform Subaccount - ${params.businessName}`,
  };

  const isUpdate = Boolean(params.subaccountCode);
  const url = isUpdate
    ? `${PAYSTACK_BASE_URL}/subaccount/${params.subaccountCode}`
    : `${PAYSTACK_BASE_URL}/subaccount`;

  const response = await fetch(url, {
    method: isUpdate ? "PUT" : "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok || !json.status || !json.data) {
    // If update failed because subaccount was not found, check existing or retry creation
    if (isUpdate) {
      const existing = await findExistingPaystackSubaccount(params.bankCode, params.accountNumber);
      if (existing) return existing;
    }
    throw new Error(
      json.message || `Failed to create/update Paystack subaccount (${response.status})`,
    );
  }

  return {
    subaccountCode: json.data.subaccount_code,
    id: json.data.id,
  };
}

/**
 * Ensures an organisation has a Paystack Subaccount linked.
 * Reuses existing Paystack subaccounts to prevent duplicates.
 */
export async function ensureOrganisationSubaccount(organisationId: string): Promise<string | undefined> {
  try {
    const { supabaseAdmin } = await import("@/lib/supabase-admin");
    const { data: org, error } = await supabaseAdmin
      .from("organisations")
      .select("id, name, settlement_bank_code, settlement_account_number")
      .eq("id", organisationId)
      .maybeSingle();

    if (error || !org) return undefined;

    const bankCode = org.settlement_bank_code;
    const accountNumber = org.settlement_account_number;
    const businessName = org.name || "Merchant";

    if (bankCode && accountNumber) {
      const res = await createOrUpdatePaystackSubaccount({
        businessName,
        bankCode,
        accountNumber,
        percentageCharge: 5,
      });

      return res.subaccountCode;
    }
  } catch (err) {
    console.warn(`Could not ensure subaccount for organisation ${organisationId}:`, err);
  }
  return undefined;
}

/**
 * Initialize a Paystack checkout transaction (with optional subaccount split)
 */
export async function initializePaystackTransaction(
  options: PaystackInitializeOptions,
): Promise<PaystackInitializeResponse> {
  const secretKey = getSecretKey();

  const payload: Record<string, unknown> = {
    email: options.email,
    amount: options.amount,
    callback_url: options.callbackUrl || options.callback_url,
    metadata: options.metadata,
    channels: options.channels || ["card", "bank", "ussd", "bank_transfer"],
    reference: options.reference,
  };

  if (options.subaccount) {
    payload.subaccount = options.subaccount;
    payload.bearer = options.bearer || "subaccount";
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  if (!response.ok || !json.status) {
    throw new Error(
      json.message || `Paystack initialization failed (${response.status})`,
    );
  }

  return json;
}

export const initializeTransaction = initializePaystackTransaction;

export interface VerifiedTransactionData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number; // in Kobo
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: Record<string, unknown>;
  customer: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    customer_code: string;
    phone: string | null;
    metadata: Record<string, unknown> | null;
    risk_action: string;
  };
  authorization?: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
    signature: string;
    account_name: string | null;
  };
  plan?: Record<string, unknown> | null;
}

/**
 * Verify a Paystack transaction by reference
 */
export async function verifyPaystackTransaction(
  reference: string,
): Promise<VerifiedTransactionData> {
  const secretKey = getSecretKey();

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const json = await response.json();
  if (!response.ok || !json.status) {
    throw new Error(
      json.message || `Paystack verification failed for ref ${reference}`,
    );
  }

  return json.data;
}

export const verifyTransaction = verifyPaystackTransaction;

/**
 * Verify Paystack webhook HMAC-SHA512 signature
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;
  try {
    const secretKey = getSecretKey();
    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");
    return hash === signatureHeader;
  } catch (err) {
    console.error("Webhook signature verification error:", err);
    return false;
  }
}

/**
 * Headlessly charge a stored authorization token (for recurring billing renewals)
 */
export async function chargePaystackAuthorization(options: {
  authorization_code?: string;
  authorizationCode?: string;
  email: string;
  amount: number; // in Kobo
  reference?: string;
  metadata?: Record<string, unknown>;
  subaccount?: string;
  bearer?: "account" | "subaccount";
}): Promise<VerifiedTransactionData> {
  const secretKey = getSecretKey();
  const authCode = options.authorizationCode || options.authorization_code;

  if (!authCode) {
    throw new Error("Authorization code is required to charge card");
  }

  const payload: Record<string, unknown> = {
    authorization_code: authCode,
    email: options.email,
    amount: options.amount,
    reference: options.reference,
    metadata: options.metadata,
  };

  if (options.subaccount) {
    payload.subaccount = options.subaccount;
    payload.bearer = options.bearer || "subaccount";
  }

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/charge_authorization`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const json = await response.json();
  if (!response.ok || !json.status) {
    throw new Error(
      json.message || `Recurring charge authorization failed (${response.status})`,
    );
  }

  return json.data;
}

export const chargeAuthorization = chargePaystackAuthorization;

/**
 * Create Paystack transfer recipient for settlement payouts
 */
export async function createPaystackTransferRecipient(params: {
  accountNumber: string;
  bankCode: string;
  accountName: string;
}): Promise<string> {
  const secretKey = getSecretKey();
  const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: params.accountName,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: "NGN",
    }),
  });

  const json = await response.json();
  if (!response.ok || !json.status) {
    throw new Error(
      json.message || "Failed to create Paystack transfer recipient",
    );
  }

  return json.data.recipient_code;
}

/**
 * Initiate Paystack transfer to merchant bank account
 */
export async function initiatePaystackTransfer(params: {
  amountInKobo: number;
  recipientCode: string;
  reference: string;
  reason?: string;
}): Promise<{ transfer_code: string; status: string }> {
  const secretKey = getSecretKey();
  const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: params.amountInKobo,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason || "Orbit settlement payout",
    }),
  });

  const json = await response.json();
  if (!response.ok || !json.status) {
    throw new Error(
      json.message || `Paystack transfer failed (${response.status})`,
    );
  }

  return json.data;
}
