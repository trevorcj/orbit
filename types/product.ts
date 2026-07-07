export interface Product {
  id: string;

  organisation_id: string;

  name: string;

  slug: string;

  description: string | null;

  brand_color: string | null;

  is_active: boolean;

  created_at: string;

  updated_at: string;

  plans?: {
    id: string;

    name: string;

    amount?: number;

    billing_interval?: string;
  }[];
}
