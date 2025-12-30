export interface ParentProduct {
  id: number;
  parent_id: number;
  shopify_product_id: string;
  generic_title: string | null;
  generic_description: string | null;
  generic_keywords: string | null;
  base_tech_specs: string | null;
  faqs: { question: string; answer: string }[] | null;
  glossary: { term: string; definition: string }[] | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
  product_content_variants?: number;
}

export interface ShopifyRawWebhook {
  id: number;
  shopify_product_id: string;
  raw_payload: string | object;
  received_at?: string;
  created_at?: string;
}

export interface ProductsTable {
  id: number;
  shopify_product_id: string;
  title: string | null;
  vendor: string | null;
  product_type: string | null;
  body_html: string | null;
  tags: string | null;
  ai_generated_content: string | object | null;
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
