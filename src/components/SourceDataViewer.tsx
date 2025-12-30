import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Database, Webhook, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShopifyRawWebhook, ProductsTable } from '@/types/product';
import { fetchRawWebhook, fetchProductsTableData } from '@/services/nocodbApi';
import { cn } from '@/lib/utils';

interface SourceDataViewerProps {
  shopifyProductId: string;
}

export function SourceDataViewer({ shopifyProductId }: SourceDataViewerProps) {
  const [rawWebhook, setRawWebhook] = useState<ShopifyRawWebhook | null>(null);
  const [productsData, setProductsData] = useState<ProductsTable | null>(null);
  const [loadingWebhook, setLoadingWebhook] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'webhook' | 'products' | null>(null);

  const loadWebhookData = async () => {
    if (rawWebhook) {
      setExpandedSection(expandedSection === 'webhook' ? null : 'webhook');
      return;
    }
    
    setLoadingWebhook(true);
    try {
      const data = await fetchRawWebhook(shopifyProductId);
      setRawWebhook(data);
      setExpandedSection('webhook');
    } catch (error) {
      console.error('Failed to load webhook data:', error);
    } finally {
      setLoadingWebhook(false);
    }
  };

  const loadProductsData = async () => {
    if (productsData) {
      setExpandedSection(expandedSection === 'products' ? null : 'products');
      return;
    }
    
    setLoadingProducts(true);
    try {
      const data = await fetchProductsTableData(shopifyProductId);
      setProductsData(data);
      setExpandedSection('products');
    } catch (error) {
      console.error('Failed to load products data:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Reset when product changes
  useEffect(() => {
    setRawWebhook(null);
    setProductsData(null);
    setExpandedSection(null);
  }, [shopifyProductId]);

  const formatJson = (data: unknown): string => {
    if (typeof data === 'string') {
      try {
        return JSON.stringify(JSON.parse(data), null, 2);
      } catch {
        return data;
      }
    }
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-3 mb-8">
      <h3 className="text-lg font-semibold text-foreground mb-4">Source Data</h3>
      
      {/* Raw Webhook Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          onClick={loadWebhookData}
          disabled={loadingWebhook}
          className="w-full justify-between p-4 h-auto rounded-none hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <Webhook className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Shopify Raw Webhook</span>
            <span className="text-xs text-muted-foreground">
              (Original Shopify data)
            </span>
          </div>
          {loadingWebhook ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : expandedSection === 'webhook' ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
        
        {expandedSection === 'webhook' && (
          <div className="border-t border-border p-4 bg-muted/30">
            {rawWebhook ? (
              <pre className="text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto p-3 bg-background rounded-lg border border-border">
                {formatJson(rawWebhook.raw_payload || rawWebhook)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No webhook data found for this product.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Products Table Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          onClick={loadProductsData}
          disabled={loadingProducts}
          className="w-full justify-between p-4 h-auto rounded-none hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Products Table</span>
            <span className="text-xs text-muted-foreground">
              (AI generated content)
            </span>
          </div>
          {loadingProducts ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : expandedSection === 'products' ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
        
        {expandedSection === 'products' && (
          <div className="border-t border-border p-4 bg-muted/30">
            {productsData ? (
              <div className="space-y-4">
                {/* Key fields display */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Title:</span>
                    <p className="font-medium">{productsData.title || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendor:</span>
                    <p className="font-medium">{productsData.vendor || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Product Type:</span>
                    <p className="font-medium">{productsData.product_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tags:</span>
                    <p className="font-medium">{productsData.tags || 'N/A'}</p>
                  </div>
                </div>
                
                {/* Body HTML */}
                {productsData.body_html && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">Body HTML:</span>
                    <div 
                      className="p-3 bg-background rounded-lg border border-border html-content text-sm"
                      dangerouslySetInnerHTML={{ __html: productsData.body_html }}
                    />
                  </div>
                )}

                {/* AI Generated Content */}
                {productsData.ai_generated_content && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">AI Generated Content:</span>
                    <pre className="text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto p-3 bg-background rounded-lg border border-border">
                      {formatJson(productsData.ai_generated_content)}
                    </pre>
                  </div>
                )}

                {/* Full JSON */}
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View full JSON
                  </summary>
                  <pre className="mt-2 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto p-3 bg-background rounded-lg border border-border">
                    {formatJson(productsData)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No products data found for this product.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}