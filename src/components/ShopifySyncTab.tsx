import { useState } from 'react';
import { RefreshCw, Check, AlertTriangle, Loader2, ArrowRight, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductVariant } from '@/types/product';
import { 
  fetchShopifyProduct, 
  ShopifyVariant, 
  ShopifyProduct,
  compareVariants,
  VariantComparison 
} from '@/services/shopifyApi';
import { updateProductVariant } from '@/services/nocodbApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShopifySyncTabProps {
  shopifyProductId: string;
  localVariants: ProductVariant[];
  onVariantsUpdated: () => void;
}

export function ShopifySyncTab({ 
  shopifyProductId, 
  localVariants,
  onVariantsUpdated 
}: ShopifySyncTabProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [shopifyProduct, setShopifyProduct] = useState<ShopifyProduct | null>(null);
  const [comparisons, setComparisons] = useState<VariantComparison[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hasPulled, setHasPulled] = useState(false);

  const handlePullFromShopify = async () => {
    setIsPulling(true);
    try {
      const product = await fetchShopifyProduct(shopifyProductId);
      
      if (!product) {
        toast.error('Product not found in Shopify');
        return;
      }

      setShopifyProduct(product);
      
      // Compare with local variants
      const localMapped = localVariants.map(v => ({
        id: v.id,
        shopify_variant_id: v.shopify_variant_id,
        variant_name: v.variant_name,
        tech_specs_summary: v.tech_specs_summary,
        full_specification: v.full_specification,
      }));
      
      const results = compareVariants(product.variants, localMapped);
      setComparisons(results);
      setHasPulled(true);
      
      // Auto-select variants that need updating
      const needsUpdate = results
        .filter(c => c.status === 'different' || c.status === 'shopify_only')
        .map(c => c.shopifyVariantId);
      setSelectedIds(new Set(needsUpdate));
      
      toast.success(`Pulled ${product.variants.length} variants from Shopify`);
    } catch (error) {
      console.error('Failed to pull from Shopify:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to pull from Shopify');
    } finally {
      setIsPulling(false);
    }
  };

  const handleToggleSelect = (variantId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(variantId)) {
        next.delete(variantId);
      } else {
        next.add(variantId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = comparisons
      .filter(c => c.status !== 'match')
      .map(c => c.shopifyVariantId);
    setSelectedIds(new Set(allIds));
  };

  const handleSelectNone = () => {
    setSelectedIds(new Set());
  };

  const handleSyncSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error('No variants selected');
      return;
    }

    setIsSyncing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const variantId of selectedIds) {
      const comparison = comparisons.find(c => c.shopifyVariantId === variantId);
      if (!comparison || !comparison.shopifyData) continue;

      // Only update existing local variants for now
      if (comparison.localData) {
        try {
          await updateProductVariant(comparison.localData.id, {
            variant_name: comparison.shopifyData.title,
            // Add more fields to update as needed
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to update variant ${variantId}:`, error);
          errorCount++;
        }
      }
    }

    if (successCount > 0) {
      toast.success(`Updated ${successCount} variant(s)`);
      onVariantsUpdated();
    }
    if (errorCount > 0) {
      toast.error(`Failed to update ${errorCount} variant(s)`);
    }

    setIsSyncing(false);
  };

  const getStatusIcon = (status: VariantComparison['status']) => {
    switch (status) {
      case 'match':
        return <Check className="w-4 h-4 text-success" />;
      case 'different':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'shopify_only':
        return <Plus className="w-4 h-4 text-primary" />;
      case 'local_only':
        return <Minus className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusLabel = (status: VariantComparison['status']) => {
    switch (status) {
      case 'match':
        return 'In Sync';
      case 'different':
        return 'Different';
      case 'shopify_only':
        return 'New in Shopify';
      case 'local_only':
        return 'Missing in Shopify';
    }
  };

  return (
    <div className="space-y-6">
      {/* Pull Action */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
        <div>
          <h4 className="font-medium text-foreground">Pull from Shopify</h4>
          <p className="text-sm text-muted-foreground">
            Fetch the latest variant data directly from Shopify Admin API
          </p>
        </div>
        <Button
          onClick={handlePullFromShopify}
          disabled={isPulling}
          className="gap-2"
        >
          {isPulling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isPulling ? 'Pulling...' : 'Pull Variants'}
        </Button>
      </div>

      {/* Comparison Results */}
      {hasPulled && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-success" />
                {comparisons.filter(c => c.status === 'match').length} in sync
              </span>
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-warning" />
                {comparisons.filter(c => c.status === 'different').length} different
              </span>
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-primary" />
                {comparisons.filter(c => c.status === 'shopify_only').length} new
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectNone}>
                Select None
              </Button>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="w-12 px-4 py-3"></th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Shopify Data
                  </th>
                  <th className="w-12 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Local Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((comparison) => (
                  <tr 
                    key={comparison.shopifyVariantId} 
                    className={cn(
                      "border-b border-border",
                      selectedIds.has(comparison.shopifyVariantId) && "bg-primary/5"
                    )}
                  >
                    <td className="px-4 py-3">
                      {comparison.status !== 'match' && (
                        <Checkbox
                          checked={selectedIds.has(comparison.shopifyVariantId)}
                          onCheckedChange={() => handleToggleSelect(comparison.shopifyVariantId)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(comparison.status)}
                        <span className={cn(
                          "text-sm font-medium",
                          comparison.status === 'match' && "text-success",
                          comparison.status === 'different' && "text-warning",
                          comparison.status === 'shopify_only' && "text-primary",
                          comparison.status === 'local_only' && "text-destructive"
                        )}>
                          {getStatusLabel(comparison.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {comparison.shopifyData ? (
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {comparison.shopifyData.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {comparison.shopifyData.sku || 'N/A'} | 
                            Price: ${comparison.shopifyData.price} |
                            Stock: {comparison.shopifyData.inventory_quantity}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          Not in Shopify
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ArrowRight className="w-4 h-4 text-muted-foreground mx-auto" />
                    </td>
                    <td className="px-4 py-3">
                      {comparison.localData ? (
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {comparison.localData.variant_name}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {comparison.localData.tech_specs_summary || 'No summary'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          Not in database
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sync Action */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-end gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <span className="text-sm text-foreground">
                {selectedIds.size} variant(s) selected
              </span>
              <Button
                onClick={handleSyncSelected}
                disabled={isSyncing}
                className="gap-2"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Update Selected
              </Button>
            </div>
          )}
        </div>
      )}

      {/* No data state */}
      {!hasPulled && (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Click "Pull Variants" to fetch data from Shopify and compare</p>
        </div>
      )}
    </div>
  );
}
