import { ParentProduct, ProductVariant, NocoDBResponse } from '@/types/product';

const API_BASE = 'https://nocodb.arsalanq.synology.me';
const AUTH_TOKEN = 'TXNwjfpLHecVqeiXHx1T9Jmq4zLLmFg8JlgvvcR4';

// NocoDB table IDs - UPDATE THESE with your actual table IDs from NocoDB
// Find them in NocoDB: Open table → Click on "..." menu → "Copy API URL" or check API docs
const PARENTS_TABLE_ID = 'product_content_parents'; // Replace with actual table ID like "tbl_xxxxx"
const VARIANTS_TABLE_ID = 'product_content_variants'; // Replace with actual table ID like "tbl_xxxxx"

const headers = {
  'xc-token': AUTH_TOKEN,
  'Content-Type': 'application/json',
};

// Try v2 API first, then fall back to v1 with different formats
async function fetchFromNocoDB<T>(tableName: string, params: string = ''): Promise<T[]> {
  const endpoints = [
    // v2 API format (preferred)
    `${API_BASE}/api/v2/tables/${tableName}/records${params ? `?${params}` : ''}`,
    // v1 with base name format
    `${API_BASE}/api/v1/db/data/noco/product_content/${tableName}${params ? `?${params}` : ''}`,
    // v1 with direct table format
    `${API_BASE}/api/v1/db/data/v1/${tableName}${params ? `?${params}` : ''}`,
  ];

  let lastError: Error | null = null;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      const response = await fetch(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Success! Response:', data);
        // Handle both v1 and v2 response formats
        if (Array.isArray(data)) {
          return data;
        }
        if (data.list) {
          return data.list;
        }
        if (data.records) {
          return data.records;
        }
        return [];
      }
      
      const errorText = await response.text();
      console.log(`Endpoint ${endpoint} failed:`, response.status, errorText);
    } catch (error) {
      console.log(`Endpoint ${endpoint} error:`, error);
      lastError = error as Error;
    }
  }
  
  throw lastError || new Error('All API endpoints failed');
}

export async function fetchParentProducts(): Promise<ParentProduct[]> {
  const data = await fetchFromNocoDB<ParentProduct>(PARENTS_TABLE_ID, 'limit=1000');
  return data.map(product => ({
    ...product,
    status: product.status || 'pending',
  }));
}

export async function fetchProductVariants(shopifyProductId: string): Promise<ProductVariant[]> {
  // v2 uses different filter syntax
  const filterParams = `where=(shopify_product_id,eq,${shopifyProductId})&limit=100`;
  return fetchFromNocoDB<ProductVariant>(VARIANTS_TABLE_ID, filterParams);
}

export async function updateParentProduct(
  id: number,
  updates: Partial<ParentProduct>
): Promise<ParentProduct> {
  // Try v2 first
  const endpoints = [
    `${API_BASE}/api/v2/tables/${PARENTS_TABLE_ID}/records`,
    `${API_BASE}/api/v1/db/data/noco/product_content/${PARENTS_TABLE_ID}/${id}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const isV2 = endpoint.includes('/api/v2/');
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(isV2 ? { Id: id, ...updates } : updates),
      });
      
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.log(`Update endpoint ${endpoint} failed:`, error);
    }
  }
  
  throw new Error('Failed to update product');
}

export async function updateProductVariant(
  id: number,
  updates: Partial<ProductVariant>
): Promise<ProductVariant> {
  const endpoints = [
    `${API_BASE}/api/v2/tables/${VARIANTS_TABLE_ID}/records`,
    `${API_BASE}/api/v1/db/data/noco/product_content/${VARIANTS_TABLE_ID}/${id}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const isV2 = endpoint.includes('/api/v2/');
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(isV2 ? { Id: id, ...updates } : updates),
      });
      
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.log(`Update endpoint ${endpoint} failed:`, error);
    }
  }
  
  throw new Error('Failed to update variant');
}
