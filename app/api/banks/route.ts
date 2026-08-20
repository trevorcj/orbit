import { NextResponse } from "next/server";
import { getPaystackBanks } from "@/lib/paystack";

// Fallback bank list if network/API is temporarily unavailable
const FALLBACK_BANKS = [
  { name: "Access Bank", code: "044", slug: "access-bank" },
  { name: "Access Bank (Diamond)", code: "063", slug: "access-bank-diamond" },
  { name: "Ecobank Nigeria", code: "050", slug: "ecobank-nigeria" },
  { name: "Fidelity Bank", code: "070", slug: "fidelity-bank" },
  { name: "First Bank of Nigeria", code: "011", slug: "first-bank-of-nigeria" },
  { name: "First City Monument Bank (FCMB)", code: "214", slug: "first-city-monument-bank" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058", slug: "guaranty-trust-bank" },
  { name: "Heritage Bank", code: "030", slug: "heritage-bank" },
  { name: "Jaiz Bank", code: "301", slug: "jaiz-bank" },
  { name: "Keystone Bank", code: "082", slug: "keystone-bank" },
  { name: "Kuda Bank", code: "50211", slug: "kuda-bank" },
  { name: "Moniepoint MFB", code: "50515", slug: "moniepoint-mfb" },
  { name: "OPay Digital Services (Paycom)", code: "999992", slug: "opay" },
  { name: "Palmpay", code: "999991", slug: "palmpay" },
  { name: "Polaris Bank", code: "076", slug: "polaris-bank" },
  { name: "Providus Bank", code: "101", slug: "providus-bank" },
  { name: "Stanbic IBTC Bank", code: "221", slug: "stanbic-ibtc-bank" },
  { name: "Standard Chartered Bank", code: "068", slug: "standard-chartered-bank" },
  { name: "Sterling Bank", code: "232", slug: "sterling-bank" },
  { name: "Suntrust Bank", code: "100", slug: "suntrust-bank" },
  { name: "Union Bank of Nigeria", code: "032", slug: "union-bank-of-nigeria" },
  { name: "United Bank For Africa (UBA)", code: "033", slug: "united-bank-for-africa" },
  { name: "Unity Bank", code: "215", slug: "unity-bank" },
  { name: "VFD Microfinance Bank", code: "566", slug: "vfd-mfb" },
  { name: "Wema Bank (ALAT)", code: "035", slug: "wema-bank" },
  { name: "Zenith Bank", code: "057", slug: "zenith-bank" },
];

export async function GET() {
  try {
    const banks = await getPaystackBanks();
    if (banks && banks.length > 0) {
      return NextResponse.json(banks);
    }
    return NextResponse.json(FALLBACK_BANKS);
  } catch (error) {
    console.warn("Paystack banks API fetch error, using fallback bank directory:", error);
    return NextResponse.json(FALLBACK_BANKS);
  }
}
