export interface Product {
  id: string;
  organisation_id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  brand_color: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
}
