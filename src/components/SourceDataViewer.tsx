import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Database, Webhook, Loader2, Package, Columns, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShopifyRawWebhook, ProductsTable, ShopifyWebhookVariant, ProductsTableVariant } from '@/types/product';
import { fetchRawWebhook, fetchProductsTableData } from '@/services/nocodbApi';
import { cn } from '@/lib/utils';

interface SourceDataViewerProps {
  shopifyProductId: string;
}

type ViewMode = 'individual' | 'comparison';

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="py-2 border-b border-border/50 last:border-b-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function ComparisonRow({ 
  label, 
  webhookValue, 
  productsValue 
}: { 
  label: string; 
  webhookValue: React.ReactNode; 
  productsValue: React.ReactNode;
}) {
  const hasWebhook = webhookValue !== null && webhookValue !== undefined && webhookValue !== '';
  const hasProducts = productsValue !== null && productsValue !== undefined && productsValue !== '';
  
  if (!hasWebhook && !hasProducts) return null;
  
  return (
    <div className="grid grid-cols-[1fr,auto,1fr] gap-4 py-3 border-b border-border/50 last:border-b-0 items-start">
      <div>
        <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">{label}</span>
        <div className="text-sm">{hasWebhook ? webhookValue : <span className="text-muted-foreground italic">N/A</span>}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground mt-5" />
      <div>
        <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">{label} (AI)</span>
        <div className="text-sm">{hasProducts ? productsValue : <span className="text-muted-foreground italic">N/A</span>}</div>
      </div>
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
  const compareAtPrice = 'compare_at_price' in variant ? String(variant.compare_at_price || '') : '';
  
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full justify-between p-3 h-auto rounded-none hover:bg-muted/50"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Package className="w-3 h-3 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">${price}</span>
          {compareAtPrice && compareAtPrice !== 'null' && (
            <span className="text-xs text-muted-foreground line-through">${compareAtPrice}</span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </Button>
      
      {isExpanded && (
        <div className="border-t border-border p-3 bg-muted/20 grid grid-cols-2 gap-3 text-sm">
          <FieldRow label="Price" value={`$${price}`} />
          {compareAtPrice && compareAtPrice !== 'null' && (
            <FieldRow label="Compare at Price" value={`$${compareAtPrice}`} />
          )}
          <FieldRow label="SKU" value={sku} />
          {'barcode' in variant && variant.barcode && (
            <FieldRow label="Barcode" value={String(variant.barcode)} />
          )}
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
          {'taxable' in variant && (
            <FieldRow label="Taxable" value={variant.taxable ? 'Yes' : 'No'} />
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
  const [expandedSection, setExpandedSection] = useState<'webhook' | 'products' | 'comparison' | null>(null);
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('individual');

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

  const loadComparisonData = async () => {
    if (rawWebhook && productsData) {
      setExpandedSection(expandedSection === 'comparison' ? null : 'comparison');
      return;
    }

    const promises: Promise<void>[] = [];
    
    if (!rawWebhook) {
      setLoadingWebhook(true);
      promises.push(
        fetchRawWebhook(shopifyProductId)
          .then(data => setRawWebhook(data))
          .catch(error => console.error('Failed to load webhook data:', error))
          .finally(() => setLoadingWebhook(false))
      );
    }
    
    if (!productsData) {
      setLoadingProducts(true);
      promises.push(
        fetchProductsTableData(shopifyProductId)
          .then(data => setProductsData(data))
          .catch(error => console.error('Failed to load products data:', error))
          .finally(() => setLoadingProducts(false))
      );
    }

    await Promise.all(promises);
    setExpandedSection('comparison');
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

  // Handle both raw_payload and full_payload field names
  const webhookPayload = rawWebhook 
    ? parsePayload(rawWebhook.raw_payload || rawWebhook.full_payload || {}) 
    : null;
  const webhookVariants = (webhookPayload?.variants as ShopifyWebhookVariant[]) || [];
  const productsVariants = productsData ? parseVariants(productsData.variants) : [];

  const isLoadingComparison = loadingWebhook || loadingProducts;

  return (
    <div className="space-y-3 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Source Data</h3>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'individual' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('individual')}
            className="text-xs h-7"
          >
            Individual
          </Button>
          <Button
            variant={viewMode === 'comparison' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('comparison')}
            className="text-xs h-7 gap-1"
          >
            <Columns className="w-3 h-3" />
            Compare
          </Button>
        </div>
      </div>

      {viewMode === 'individual' ? (
        <>
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
                    <div className="grid grid-cols-2 gap-4">
                      <FieldRow label="Product ID" value={webhookPayload.id?.toString() || rawWebhook?.shopify_product_id} />
                      <FieldRow label="Title" value={webhookPayload.title as string} />
                      <FieldRow label="Vendor" value={webhookPayload.vendor as string} />
                      <FieldRow label="Product Type" value={webhookPayload.product_type as string} />
                      <FieldRow label="Tags" value={webhookPayload.tags as string} />
                      <FieldRow label="Received At" value={rawWebhook?.received_at} />
                    </div>

                    {webhookPayload.body_html && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Product Description</span>
                        <div 
                          className="mt-1 p-3 bg-background rounded-lg border border-border text-sm html-content"
                          dangerouslySetInnerHTML={{ __html: webhookPayload.body_html as string }}
                        />
                      </div>
                    )}

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
        </>
      ) : (
        /* Comparison View */
        <div className="border border-border rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            onClick={loadComparisonData}
            disabled={isLoadingComparison}
            className="w-full justify-between p-4 h-auto rounded-none hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <Columns className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Side-by-Side Comparison</span>
              <span className="text-xs text-muted-foreground">(Webhook → AI Processed)</span>
            </div>
            {isLoadingComparison ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : expandedSection === 'comparison' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
          
          {expandedSection === 'comparison' && (
            <div className="border-t border-border p-4 bg-muted/30 space-y-4">
              {webhookPayload || productsData ? (
                <>
                  {/* Header Labels */}
                  <div className="grid grid-cols-[1fr,auto,1fr] gap-4 pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Webhook className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Shopify Webhook</span>
                    </div>
                    <div />
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">AI Processed</span>
                    </div>
                  </div>

                  {/* Comparison Rows */}
                  <ComparisonRow
                    label="Title"
                    webhookValue={webhookPayload?.title as string}
                    productsValue={productsData?.product_name || productsData?.title}
                  />
                  <ComparisonRow
                    label="Vendor"
                    webhookValue={webhookPayload?.vendor as string}
                    productsValue={productsData?.vendor}
                  />
                  <ComparisonRow
                    label="Product Type"
                    webhookValue={webhookPayload?.product_type as string}
                    productsValue={productsData?.product_type}
                  />
                  <ComparisonRow
                    label="Tags"
                    webhookValue={webhookPayload?.tags as string}
                    productsValue={productsData?.tags}
                  />
                  {productsData?.safety_verdict && (
                    <ComparisonRow
                      label="Safety Verdict"
                      webhookValue={<span className="text-muted-foreground italic">Not available</span>}
                      productsValue={
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

                  {/* Description Comparison */}
                  {(webhookPayload?.body_html || productsData?.shopify_description || productsData?.body_html) && (
                    <div className="pt-4">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-3">Description Comparison</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1">Original (Webhook)</span>
                          {webhookPayload?.body_html ? (
                            <div 
                              className="p-3 bg-background rounded-lg border border-border text-sm html-content max-h-48 overflow-y-auto"
                              dangerouslySetInnerHTML={{ __html: webhookPayload.body_html as string }}
                            />
                          ) : (
                            <div className="p-3 bg-background rounded-lg border border-border text-sm text-muted-foreground italic">
                              N/A
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1">AI Processed</span>
                          {(productsData?.shopify_description || productsData?.body_html) ? (
                            <div 
                              className="p-3 bg-background rounded-lg border border-border text-sm html-content max-h-48 overflow-y-auto"
                              dangerouslySetInnerHTML={{ __html: productsData?.shopify_description || productsData?.body_html || '' }}
                            />
                          ) : (
                            <div className="p-3 bg-background rounded-lg border border-border text-sm text-muted-foreground italic">
                              N/A
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Variants Comparison */}
                  {(webhookVariants.length > 0 || productsVariants.length > 0) && (
                    <div className="pt-4">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-3">Variants Comparison</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground block mb-2">
                            Original ({webhookVariants.length} variants)
                          </span>
                          <div className="space-y-2">
                            {webhookVariants.length > 0 ? webhookVariants.map((variant, idx) => (
                              <VariantCard
                                key={variant.id || idx}
                                variant={variant}
                                index={idx}
                                isExpanded={expandedVariants[`compare-webhook-${idx}`] || false}
                                onToggle={() => toggleVariant(`compare-webhook-${idx}`)}
                              />
                            )) : (
                              <div className="p-3 bg-background rounded-lg border border-border text-sm text-muted-foreground italic">
                                No variants
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block mb-2">
                            AI Processed ({productsVariants.length} variants)
                          </span>
                          <div className="space-y-2">
                            {productsVariants.length > 0 ? productsVariants.map((variant, idx) => (
                              <VariantCard
                                key={variant.variant_id || idx}
                                variant={variant}
                                index={idx}
                                isExpanded={expandedVariants[`compare-products-${idx}`] || false}
                                onToggle={() => toggleVariant(`compare-products-${idx}`)}
                              />
                            )) : (
                              <div className="p-3 bg-background rounded-lg border border-border text-sm text-muted-foreground italic">
                                No variants
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Generated Content */}
                  {productsData?.ai_generated_content && (
                    <div className="pt-4">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">AI Generated Content (Unique to AI)</span>
                      <pre className="text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto p-3 bg-background rounded-lg border border-border">
                        {typeof productsData.ai_generated_content === 'string' 
                          ? productsData.ai_generated_content 
                          : JSON.stringify(productsData.ai_generated_content, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No data available for comparison.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
