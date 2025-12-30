// Shopify API service - fetches product data via n8n proxy webhook

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

// N8N webhook configuration - stored in localStorage for easy user configuration
const N8N_WEBHOOK_STORAGE_KEY = 'n8n_shopify_webhook_url';

export function getN8nWebhookUrl(): string | null {
  return localStorage.getItem(N8N_WEBHOOK_STORAGE_KEY);
}

export function setN8nWebhookUrl(url: string): void {
  localStorage.setItem(N8N_WEBHOOK_STORAGE_KEY, url);
}

// Fetch a single product with all its variants via n8n webhook
export async function fetchShopifyProduct(
  shopifyProductId: string,
  webhookUrl?: string
): Promise<ShopifyProduct | null> {
  const url = webhookUrl || getN8nWebhookUrl();
  
  if (!url) {
    throw new Error('N8N webhook URL not configured. Please set the webhook URL first.');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'fetch_product',
        shopify_product_id: shopifyProductId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`N8N webhook error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Handle different response formats from n8n
    if (data.product) {
      return data.product;
    }
    if (data.variants) {
      // If n8n returns just variants, wrap it
      return data as ShopifyProduct;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch from n8n webhook:', error);
    throw error;
  }
}

// Fetch only variants for a product
export async function fetchShopifyVariants(
  shopifyProductId: string,
  webhookUrl?: string
): Promise<ShopifyVariant[]> {
  const product = await fetchShopifyProduct(shopifyProductId, webhookUrl);
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
