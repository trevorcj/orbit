import crypto from "crypto";

const BASE_URL = "https://api.nomba.com";

export async function getAccessToken() {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {
    console.log("Calling Nomba auth...");
    console.log({
      accountId: process.env.NOMBA_PARENT_ACCOUNT_ID,
      clientId: process.env.NOMBA_CLIENT_ID,
      hasSecret: !!process.env.NOMBA_PRIVATE_KEY,
    });

    const response = await fetch(`${BASE_URL}/v1/auth/token/issue`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        accountId: process.env.NOMBA_PARENT_ACCOUNT_ID!,
      },

      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: process.env.NOMBA_CLIENT_ID,
        client_secret: process.env.NOMBA_PRIVATE_KEY,
      }),

      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await response.text();

    console.log("Nomba auth response:", response.status, text);

    if (!response.ok) {
      throw new Error(`Nomba auth failed ${response.status}: ${text}`);
    }

    const data = JSON.parse(text);

    return data.data.access_token;
  } catch (error) {
    console.error("getAccessToken error:", error);

    throw error;
  }
}

export async function lookupAccount(accountNumber: string, bankCode: string) {
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}/v1/transfers/bank/lookup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      accountId: process.env.NOMBA_PARENT_ACCOUNT_ID!,
    },
    body: JSON.stringify({
      bankCode,
      accountNumber,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Nomba account lookup error:", response.status, text);

    let errorMessage = "Account lookup failed";
    try {
      const error = JSON.parse(text);
      errorMessage = error.message || error.error || "Account lookup failed";
    } catch {
      errorMessage = text || "Account lookup failed";
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.data;
}

export async function createCheckoutOrder(params: {
  amount: number;
  customerEmail: string;
  callbackUrl: string;
  productId: string;
  planId: string;
}) {
  const token = await getAccessToken();

  const orderReference = crypto.randomUUID();

  const response = await fetch(`${BASE_URL}/v1/checkout/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      accountId: process.env.NOMBA_PARENT_ACCOUNT_ID!,
    },
    body: JSON.stringify({
      order: {
        orderReference,
        amount: params.amount,
        currency: "NGN",
        customerEmail: params.customerEmail,
        callbackUrl: params.callbackUrl,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(`Nomba checkout failed: ${response.status} ${text}`);
  }

  const data = await response.json();

  return {
    checkoutUrl: data?.data?.checkoutLink ?? null,
    orderReference,
  };
}
