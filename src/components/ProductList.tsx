import { useState, useMemo } from 'react';
import { Search, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatusBadge } from './StatusBadge';
import { ParentProduct } from '@/types/product';
import { cn } from '@/lib/utils';

interface ProductListProps {
  products: ParentProduct[];
  selectedProductId: number | null;
  onSelectProduct: (product: ParentProduct) => void;
  isLoading: boolean;
}

export function ProductList({
  products,
  selectedProductId,
  onSelectProduct,
  isLoading,
}: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.generic_title?.toLowerCase().includes(query) ||
        String(product.shopify_product_id)?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const stats = useMemo(() => {
    const approved = products.filter((p) => p.status === 'approved').length;
    const pending = products.filter((p) => p.status === 'pending').length;
    return { approved, pending, total: products.length };
  }, [products]);

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Package className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-sidebar-foreground">Product Review</h1>
            <p className="text-xs text-muted-foreground">Content Dashboard</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 px-3 py-2 rounded-lg bg-background">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{stats.total}</p>
          </div>
          <div className="flex-1 px-3 py-2 rounded-lg bg-success-muted">
            <p className="text-xs text-success">Approved</p>
            <p className="text-lg font-semibold text-success">{stats.approved}</p>
          </div>
          <div className="flex-1 px-3 py-2 rounded-lg bg-warning-muted">
            <p className="text-xs text-warning">Pending</p>
            <p className="text-lg font-semibold text-warning">{stats.pending}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-sidebar-border"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-sidebar-accent animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Package className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No products found' : 'No products available'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-smooth',
                  'hover:bg-sidebar-accent',
                  selectedProductId === product.id
                    ? 'bg-sidebar-accent border border-sidebar-border'
                    : 'border border-transparent'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {product.generic_title || 'Untitled Product'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      ID: {product.shopify_product_id}
                    </p>
                  </div>
                  <StatusBadge status={product.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
