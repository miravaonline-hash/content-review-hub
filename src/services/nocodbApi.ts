import { ParentProduct, ProductVariant, NocoDBResponse } from '@/types/product';

const API_BASE = 'https://nocodb.arsalanq.synology.me';
const AUTH_TOKEN = 'TXNwjfpLHecVqeiXHx1T9Jmq4zLLmFg8JlgvvcR4';

const headers = {
  'xc-token': AUTH_TOKEN,
  'Content-Type': 'application/json',
};

export async function fetchParentProducts(): Promise<ParentProduct[]> {
  const response = await fetch(
    `${API_BASE}/api/v1/db/data/noco/product_content_parents?limit=1000`,
    { headers }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }
  
  const data: NocoDBResponse<ParentProduct> = await response.json();
  return data.list.map(product => ({
    ...product,
    status: product.status || 'pending',
  }));
}

export async function fetchProductVariants(shopifyProductId: string): Promise<ProductVariant[]> {
  const response = await fetch(
    `${API_BASE}/api/v1/db/data/noco/product_content_variants?where=(shopify_product_id,eq,${shopifyProductId})&limit=100`,
    { headers }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch variants: ${response.statusText}`);
  }
  
  const data: NocoDBResponse<ProductVariant> = await response.json();
  return data.list;
}

export async function updateParentProduct(
  id: number,
  updates: Partial<ParentProduct>
): Promise<ParentProduct> {
  const response = await fetch(
    `${API_BASE}/api/v1/db/data/noco/product_content_parents/${id}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to update product: ${response.statusText}`);
  }
  
  return response.json();
}

export async function updateProductVariant(
  id: number,
  updates: Partial<ProductVariant>
): Promise<ProductVariant> {
  const response = await fetch(
    `${API_BASE}/api/v1/db/data/noco/product_content_variants/${id}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to update variant: ${response.statusText}`);
  }
  
  return response.json();
}
