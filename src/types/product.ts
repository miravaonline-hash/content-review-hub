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

export interface ShopifyWebhookVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price?: string;
  sku: string;
  option1?: string;
  option2?: string;
  option3?: string;
  inventory_quantity?: number;
  weight?: number;
  weight_unit?: string;
  taxable?: boolean;
  barcode?: string;
}

export interface ShopifyRawWebhook {
  id: number;
  shopify_product_id: string | number;
  product_title?: string;
  raw_payload?: string | {
    id?: number;
    title?: string;
    vendor?: string;
    product_type?: string;
    body_html?: string;
    tags?: string;
    variants?: ShopifyWebhookVariant[];
    options?: { name: string; values: string[] }[];
    images?: { src: string; alt?: string }[];
    [key: string]: unknown;
  };
  full_payload?: string | {
    id?: number;
    title?: string;
    vendor?: string;
    product_type?: string;
    body_html?: string;
    tags?: string;
    variants?: ShopifyWebhookVariant[];
    options?: { name: string; values: string[] }[];
    images?: { src: string; alt?: string }[];
    [key: string]: unknown;
  };
  received_at?: string;
  created_at?: string;
}

export interface ProductsTableVariant {
  variant_id?: string;
  variant_name?: string;
  sku?: string;
  price?: string;
  inventory?: number;
  [key: string]: unknown;
}

export interface ProductsTable {
  id: number;
  shopify_product_id: string;
  title: string | null;
  product_name?: string | null;
  shopify_title?: string | null;
  vendor: string | null;
  product_type: string | null;
  body_html: string | null;
  shopify_description?: string | null;
  tags: string | null;
  safety_verdict?: string | null;
  ai_generated_content: string | object | null;
  variants?: ProductsTableVariant[] | string | null;
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
