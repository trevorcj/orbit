export type BillingInterval = "monthly" | "quarterly" | "yearly";

export interface Plan {
  id: string;
  product_id: string;
  organisation_id: string;
  name: string | null;
  description: string | null;
  features: string[] | null;
  currency: string | null;
  amount: number | null;
  billing_interval: BillingInterval | string | null;
  trial_period_days: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
}
