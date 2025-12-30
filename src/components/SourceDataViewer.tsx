import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Database, Webhook, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShopifyRawWebhook, ProductsTable, ShopifyWebhookVariant, ProductsTableVariant } from '@/types/product';
import { fetchRawWebhook, fetchProductsTableData } from '@/services/nocodbApi';
import { cn } from '@/lib/utils';

interface SourceDataViewerProps {
  shopifyProductId: string;
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="py-2 border-b border-border/50 last:border-b-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function VariantCard({ 
  variant, 
  index, 
  isExpanded, 
  onToggle 
}: { 
  variant: ShopifyWebhookVariant | ProductsTableVariant; 
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const title = ('title' in variant ? String(variant.title) : String(variant.variant_name || '')) || `Variant ${index + 1}`;
  const sku = String(variant.sku || 'N/A');
  const price = String(variant.price || 'N/A');
  
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full justify-between p-3 h-auto rounded-none hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <Package className="w-3 h-3 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
          <span className="text-xs text-muted-foreground">SKU: {sku}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </Button>
      
      {isExpanded && (
        <div className="border-t border-border p-3 bg-muted/20 grid grid-cols-2 gap-3 text-sm">
          <FieldRow label="Price" value={price} />
          <FieldRow label="SKU" value={sku} />
          {'option1' in variant && variant.option1 && (
            <FieldRow label="Option 1" value={String(variant.option1)} />
          )}
          {'option2' in variant && variant.option2 && (
            <FieldRow label="Option 2" value={String(variant.option2)} />
          )}
          {'option3' in variant && variant.option3 && (
            <FieldRow label="Option 3" value={String(variant.option3)} />
          )}
          {'inventory_quantity' in variant && variant.inventory_quantity !== undefined && (
            <FieldRow label="Inventory" value={String(variant.inventory_quantity)} />
          )}
          {'inventory' in variant && variant.inventory !== undefined && (
            <FieldRow label="Inventory" value={String(variant.inventory)} />
          )}
          {'weight' in variant && variant.weight && (
            <FieldRow label="Weight" value={`${variant.weight} ${variant.weight_unit || ''}`} />
          )}
        </div>
      )}
    </div>
  );
}

export function SourceDataViewer({ shopifyProductId }: SourceDataViewerProps) {
  const [rawWebhook, setRawWebhook] = useState<ShopifyRawWebhook | null>(null);
  const [productsData, setProductsData] = useState<ProductsTable | null>(null);
  const [loadingWebhook, setLoadingWebhook] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'webhook' | 'products' | null>(null);
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});

  const toggleVariant = (key: string) => {
    setExpandedVariants(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

  useEffect(() => {
    setRawWebhook(null);
    setProductsData(null);
    setExpandedSection(null);
    setExpandedVariants({});
  }, [shopifyProductId]);

  const parsePayload = (payload: string | object): Record<string, unknown> => {
    if (typeof payload === 'string') {
      try {
        return JSON.parse(payload);
      } catch {
        return {};
      }
    }
    return payload as Record<string, unknown>;
  };

  const parseVariants = (variants: ProductsTableVariant[] | string | null | undefined): ProductsTableVariant[] => {
    if (!variants) return [];
    if (Array.isArray(variants)) return variants;
    if (typeof variants === 'string') {
      try {
        return JSON.parse(variants);
      } catch {
        return [];
      }
    }
    return [];
  };

  const webhookPayload = rawWebhook ? parsePayload(rawWebhook.raw_payload) : null;
  const webhookVariants = (webhookPayload?.variants as ShopifyWebhookVariant[]) || [];
  const productsVariants = productsData ? parseVariants(productsData.variants) : [];

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
            <span className="text-xs text-muted-foreground">(Original Shopify data)</span>
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
          <div className="border-t border-border p-4 bg-muted/30 space-y-4">
            {webhookPayload ? (
              <>
                {/* Key Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FieldRow label="Product ID" value={webhookPayload.id?.toString() || rawWebhook?.shopify_product_id} />
                  <FieldRow label="Title" value={webhookPayload.title as string} />
                  <FieldRow label="Vendor" value={webhookPayload.vendor as string} />
                  <FieldRow label="Product Type" value={webhookPayload.product_type as string} />
                  <FieldRow label="Tags" value={webhookPayload.tags as string} />
                  <FieldRow label="Received At" value={rawWebhook?.received_at} />
                </div>

                {/* Description */}
                {webhookPayload.body_html && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Product Description</span>
                    <div 
                      className="mt-1 p-3 bg-background rounded-lg border border-border text-sm html-content"
                      dangerouslySetInnerHTML={{ __html: webhookPayload.body_html as string }}
                    />
                  </div>
                )}

                {/* Variants */}
                {webhookVariants.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                      Variants ({webhookVariants.length})
                    </span>
                    <div className="space-y-2">
                      {webhookVariants.map((variant, idx) => (
                        <VariantCard
                          key={variant.id || idx}
                          variant={variant}
                          index={idx}
                          isExpanded={expandedVariants[`webhook-${idx}`] || false}
                          onToggle={() => toggleVariant(`webhook-${idx}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Full JSON */}
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View full JSON
                  </summary>
                  <pre className="mt-2 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto p-3 bg-background rounded-lg border border-border">
                    {JSON.stringify(webhookPayload, null, 2)}
                  </pre>
                </details>
              </>
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
            <span className="text-xs text-muted-foreground">(AI generated content)</span>
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
          <div className="border-t border-border p-4 bg-muted/30 space-y-4">
            {productsData ? (
              <>
                {/* Key Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FieldRow label="Product Name" value={productsData.product_name || productsData.title} />
                  <FieldRow label="Shopify Title" value={productsData.shopify_title} />
                  <FieldRow label="Vendor" value={productsData.vendor} />
                  <FieldRow label="Product Type" value={productsData.product_type} />
                  <FieldRow label="Tags" value={productsData.tags} />
                  {productsData.safety_verdict && (
                    <FieldRow 
                      label="Safety Verdict" 
                      value={
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          productsData.safety_verdict.toLowerCase().includes('safe') 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : productsData.safety_verdict.toLowerCase().includes('warning')
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-muted text-foreground"
                        )}>
                          {productsData.safety_verdict}
                        </span>
                      } 
                    />
                  )}
                </div>

                {/* Description */}
                {(productsData.shopify_description || productsData.body_html) && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      {productsData.shopify_description ? 'Shopify Description' : 'Body HTML'}
                    </span>
                    <div 
                      className="mt-1 p-3 bg-background rounded-lg border border-border text-sm html-content"
                      dangerouslySetInnerHTML={{ __html: productsData.shopify_description || productsData.body_html || '' }}
                    />
                  </div>
                )}

                {/* Variants */}
                {productsVariants.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                      Variants ({productsVariants.length})
                    </span>
                    <div className="space-y-2">
                      {productsVariants.map((variant, idx) => (
                        <VariantCard
                          key={variant.variant_id || idx}
                          variant={variant}
                          index={idx}
                          isExpanded={expandedVariants[`products-${idx}`] || false}
                          onToggle={() => toggleVariant(`products-${idx}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Generated Content */}
                {productsData.ai_generated_content && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">AI Generated Content</span>
                    <pre className="mt-1 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto p-3 bg-background rounded-lg border border-border">
                      {typeof productsData.ai_generated_content === 'string' 
                        ? productsData.ai_generated_content 
                        : JSON.stringify(productsData.ai_generated_content, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Full JSON */}
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View full JSON
                  </summary>
                  <pre className="mt-2 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto p-3 bg-background rounded-lg border border-border">
                    {JSON.stringify(productsData, null, 2)}
                  </pre>
                </details>
              </>
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
