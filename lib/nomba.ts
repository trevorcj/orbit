const BASE_URL = "https://api.nomba.com";

export async function getAccessToken() {
  try {
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

    if (!response.ok) {
      const error = await response.text();
      console.error("Nomba auth error:", response.status, error);
      throw new Error(`Nomba auth failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.data.access_token;
  } catch (error) {
    console.error("getAccessToken error:", error);
    throw new Error("Failed to authenticate with Nomba");
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
  console.log("Account lookup response:", data);

  return data.data;
}
