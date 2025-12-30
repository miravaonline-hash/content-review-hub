// Shopify Admin API service for fetching product and variant data
// Note: These would typically be stored securely. For now using env vars.

const SHOPIFY_STORE_URL = import.meta.env.VITE_SHOPIFY_STORE_URL || '';
const SHOPIFY_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN || '';

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string | null;
  fulfillment_service: string;
  inventory_management: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string | null;
  grams: number;
  weight: number;
  weight_unit: string;
  inventory_item_id: number;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
  admin_graphql_api_id: string;
  image_id: number | null;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  template_suffix: string | null;
  published_scope: string;
  tags: string;
  status: string;
  admin_graphql_api_id: string;
  variants: ShopifyVariant[];
  options: { id: number; product_id: number; name: string; position: number; values: string[] }[];
  images: { id: number; product_id: number; position: number; src: string; alt: string | null }[];
}

export interface ShopifyApiConfig {
  storeUrl: string;
  accessToken: string;
}

// Get config from environment or stored values
export function getShopifyConfig(): ShopifyApiConfig | null {
  if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
    return null;
  }
  return {
    storeUrl: SHOPIFY_STORE_URL,
    accessToken: SHOPIFY_ACCESS_TOKEN,
  };
}

// Fetch a single product with all its variants from Shopify
export async function fetchShopifyProduct(
  shopifyProductId: string,
  config?: ShopifyApiConfig
): Promise<ShopifyProduct | null> {
  const apiConfig = config || getShopifyConfig();
  
  if (!apiConfig) {
    throw new Error('Shopify API not configured. Please set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN.');
  }

  const { storeUrl, accessToken } = apiConfig;
  
  // Clean the store URL (remove protocol and trailing slashes)
  const cleanStoreUrl = storeUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  const apiUrl = `https://${cleanStoreUrl}/admin/api/2024-01/products/${shopifyProductId}.json`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorText = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Failed to fetch from Shopify:', error);
    throw error;
  }
}

// Fetch only variants for a product
export async function fetchShopifyVariants(
  shopifyProductId: string,
  config?: ShopifyApiConfig
): Promise<ShopifyVariant[]> {
  const product = await fetchShopifyProduct(shopifyProductId, config);
  return product?.variants || [];
}

// Compare Shopify variant with local variant
export interface VariantComparison {
  shopifyVariantId: string;
  shopifyData: ShopifyVariant | null;
  localData: {
    id: number;
    variant_name: string;
    tech_specs_summary: string | null;
    full_specification: string | null;
  } | null;
  status: 'match' | 'different' | 'shopify_only' | 'local_only';
  differences: string[];
}

export function compareVariants(
  shopifyVariants: ShopifyVariant[],
  localVariants: { id: number; shopify_variant_id: string; variant_name: string; tech_specs_summary: string | null; full_specification: string | null }[]
): VariantComparison[] {
  const comparisons: VariantComparison[] = [];
  const localMap = new Map(localVariants.map(v => [String(v.shopify_variant_id), v]));
  const processedIds = new Set<string>();

  // Check Shopify variants
  for (const sv of shopifyVariants) {
    const svId = String(sv.id);
    processedIds.add(svId);
    const local = localMap.get(svId);

    if (!local) {
      comparisons.push({
        shopifyVariantId: svId,
        shopifyData: sv,
        localData: null,
        status: 'shopify_only',
        differences: ['Variant exists in Shopify but not in local database'],
      });
    } else {
      const differences: string[] = [];
      
      // Compare variant name/title
      if (sv.title !== local.variant_name) {
        differences.push(`Name: "${local.variant_name}" → "${sv.title}"`);
      }
      
      // Compare price (if stored locally)
      // Compare SKU (if stored locally)
      // Add more field comparisons as needed
      
      comparisons.push({
        shopifyVariantId: svId,
        shopifyData: sv,
        localData: local,
        status: differences.length > 0 ? 'different' : 'match',
        differences,
      });
    }
  }

  // Check for local-only variants
  for (const lv of localVariants) {
    if (!processedIds.has(String(lv.shopify_variant_id))) {
      comparisons.push({
        shopifyVariantId: String(lv.shopify_variant_id),
        shopifyData: null,
        localData: lv,
        status: 'local_only',
        differences: ['Variant exists locally but not in Shopify'],
      });
    }
  }

  return comparisons;
}
