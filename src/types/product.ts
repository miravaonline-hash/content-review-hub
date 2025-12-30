export interface ParentProduct {
  id: number;
  shopify_product_id: string;
  product_name: string;
  generic_title: string | null;
  generic_description: string | null;
  generic_keywords: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariant {
  id: number;
  shopify_product_id: string;
  shopify_variant_id: string;
  variant_name: string;
  tech_specs_summary: string | null;
  full_specification: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NocoDBResponse<T> {
  list: T[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
    isFirstPage: boolean;
    isLastPage: boolean;
  };
}
