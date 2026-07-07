export interface Payment {
  id: string;
  organisation_id: string;
  subscription_id: string | null;
  customer_id: string | null;
  amount: number;
  currency: string;
  status: "success" | "failed" | "pending" | "reversed";
  provider: string;
  provider_reference: string | null;
  paid_at: string | null;
  created_at: string;
  // Standard relational joins
  customers: {
    name: string;
    email: string;
  } | null;
  subscriptions: {
    plans: {
      name: string;
    } | null;
  } | null;
}
