import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/nomba";

export async function GET() {
  try {
    const token = await getAccessToken();

    const response = await fetch("https://api.nomba.com/v1/transfers/banks", {
      headers: {
        Authorization: `Bearer ${token}`,
        accountId: process.env.NOMBA_PARENT_ACCOUNT_ID!,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Nomba API error:", response.status, errorData);
      return NextResponse.json(
        { message: `Nomba API error: ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log(
      "Banks response structure:",
      JSON.stringify(data, null, 2).substring(0, 500),
    );

    const banks = data.data?.results || data.results || data.data || [];
    console.log("Banks to return:", banks.length, "banks");

    return NextResponse.json(banks);
  } catch (error) {
    console.error("Banks fetch error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to fetch banks",
      },
      { status: 500 },
    );
  }
}
