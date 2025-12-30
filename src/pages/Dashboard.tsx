import { useState, useEffect } from 'react';
import { ProductList } from '@/components/ProductList';
import { ProductDetail } from '@/components/ProductDetail';
import { EmptyState } from '@/components/EmptyState';
import { ParentProduct } from '@/types/product';
import { fetchParentProducts } from '@/services/nocodbApi';
import { toast } from 'sonner';

export default function Dashboard() {
  const [products, setProducts] = useState<ParentProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ParentProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchParentProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, []);

  const handleProductUpdated = (updatedProduct: ParentProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    setSelectedProduct(updatedProduct);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 lg:w-96 flex-shrink-0 border-r border-border">
        <ProductList
          products={products}
          selectedProductId={selectedProduct?.id ?? null}
          onSelectProduct={setSelectedProduct}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {selectedProduct ? (
          <ProductDetail
            key={selectedProduct.id}
            product={selectedProduct}
            onProductUpdated={handleProductUpdated}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
