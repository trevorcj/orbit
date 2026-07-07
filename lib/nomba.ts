import crypto from "crypto";

const BASE_URL = "https://api.nomba.com";

export async function getAccessToken() {
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
  });

  const text = await response.text();

  console.log("NOMBA AUTH:", response.status, text);

  if (!response.ok) {
    throw new Error(`Nomba auth failed: ${text}`);
  }

  const data = JSON.parse(text);

  return data.data.access_token;
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

  const text = await response.text();

  console.log("NOMBA CHECKOUT:", response.status, text);

  if (!response.ok) {
    throw new Error(`Nomba checkout failed: ${text}`);
  }

  const data = JSON.parse(text);

  return {
    checkoutUrl: data?.data?.checkoutLink ?? null,

    orderReference,
  };
}

export async function chargeTokenizedCard(params: {
  amount: number;
  cardId: string;
  customerId: string;
  merchantTxRef: string;
}) {
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}/v1/tokenized-card/charge`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      accountId: process.env.NOMBA_PARENT_ACCOUNT_ID!,
    },

    body: JSON.stringify({
      amount: params.amount,

      currency: "NGN",

      cardId: params.cardId,

      customerId: params.customerId,

      merchantTxRef: params.merchantTxRef,
    }),
  });

  const text = await response.text();

  console.log("NOMBA TOKEN CHARGE:", response.status, text);

  if (!response.ok) {
    throw new Error(`Nomba token charge failed: ${text}`);
  }

  return JSON.parse(text);
}

export async function verifyTransaction(orderReference: string) {
  const token = await getAccessToken();

  const url = new URL(`${BASE_URL}/v1/transactions/accounts/single`);

  url.searchParams.set("orderReference", orderReference);

  const response = await fetch(url.toString(), {
    method: "GET",

    headers: {
      Authorization: `Bearer ${token}`,
      accountId: process.env.NOMBA_PARENT_ACCOUNT_ID!,
    },

    cache: "no-store",
  });

  const text = await response.text();

  console.log("NOMBA VERIFY:", response.status, text);

  if (!response.ok) {
    throw new Error(`Nomba verification failed: ${text}`);
  }

  return JSON.parse(text);
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

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Account lookup failed: ${text}`);
  }

  const data = JSON.parse(text);

  return data.data;
}
