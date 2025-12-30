import { useState, useEffect } from 'react';
import { Check, X, Edit3, Save, Loader2, Tag, FileText, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { StatusBadge } from './StatusBadge';
import { VariantsTable } from './VariantsTable';
import { SourceDataViewer } from './SourceDataViewer';
import { ParentProduct, ProductVariant } from '@/types/product';
import { fetchProductVariants, updateParentProduct } from '@/services/nocodbApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductDetailProps {
  product: ParentProduct;
  onProductUpdated: (product: ParentProduct) => void;
}

export function ProductDetail({ product, onProductUpdated }: ProductDetailProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editedTitle, setEditedTitle] = useState(product.generic_title || '');
  const [editedDescription, setEditedDescription] = useState(product.generic_description || '');
  const [editedKeywords, setEditedKeywords] = useState(product.generic_keywords || '');

  useEffect(() => {
    setEditedTitle(product.generic_title || '');
    setEditedDescription(product.generic_description || '');
    setEditedKeywords(product.generic_keywords || '');
    setIsEditing(false);
  }, [product]);

  useEffect(() => {
    async function loadVariants() {
      if (!product.shopify_product_id) return;
      
      setIsLoadingVariants(true);
      try {
        const data = await fetchProductVariants(product.shopify_product_id);
        setVariants(data);
      } catch (error) {
        console.error('Failed to load variants:', error);
        toast.error('Failed to load variants');
      } finally {
        setIsLoadingVariants(false);
      }
    }
    
    loadVariants();
  }, [product.shopify_product_id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateParentProduct(product.id, {
        generic_title: editedTitle,
        generic_description: editedDescription,
        generic_keywords: editedKeywords,
      });
      onProductUpdated({ ...product, ...updated });
      setIsEditing(false);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: 'approved' | 'rejected') => {
    setIsSaving(true);
    try {
      const updated = await updateParentProduct(product.id, { status: newStatus });
      onProductUpdated({ ...product, ...updated, status: newStatus });
      toast.success(`Product ${newStatus === 'approved' ? 'approved' : 'rejected'}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto animate-fade-in">
      <div className="max-w-4xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {product.generic_title || 'Untitled Product'}
              </h2>
              <StatusBadge status={product.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Shopify ID: {product.shopify_product_id}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditedTitle(product.generic_title || '');
                    setEditedDescription(product.generic_description || '');
                    setEditedKeywords(product.generic_keywords || '');
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Parent Product Content */}
        <div className="space-y-6 mb-10">
          {/* Title */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Tag className="w-4 h-4 text-muted-foreground" />
              Generic Title
            </label>
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Enter product title..."
                className="bg-background"
              />
            ) : (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm">
                  {product.generic_title || (
                    <span className="text-muted-foreground italic">No title set</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Generic Description
            </label>
            {isEditing ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Enter product description (HTML supported)..."
                rows={8}
                className="bg-background font-mono text-xs"
              />
            ) : (
              <div className="p-4 rounded-lg bg-muted/50 border border-border min-h-[120px]">
                {product.generic_description ? (
                  <div
                    className="html-content"
                    dangerouslySetInnerHTML={{ __html: product.generic_description }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description set</p>
                )}
              </div>
            )}
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Hash className="w-4 h-4 text-muted-foreground" />
              Generic Keywords
            </label>
            {isEditing ? (
              <Input
                value={editedKeywords}
                onChange={(e) => setEditedKeywords(e.target.value)}
                placeholder="Enter keywords, comma separated..."
                className="bg-background"
              />
            ) : (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                {product.generic_keywords ? (
                  <div className="flex flex-wrap gap-2">
                    {product.generic_keywords.split(',').map((keyword, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs bg-secondary rounded-md text-secondary-foreground"
                      >
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No keywords set</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Review Actions */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border mb-10">
          <span className="text-sm font-medium text-foreground mr-auto">
            Review Decision
          </span>
          <Button
            variant="outline"
            onClick={() => handleStatusChange('rejected')}
            disabled={isSaving || product.status === 'rejected'}
            className={cn(
              'gap-1.5',
              product.status === 'rejected' && 'border-destructive text-destructive'
            )}
          >
            <X className="w-4 h-4" />
            Reject
          </Button>
          <Button
            onClick={() => handleStatusChange('approved')}
            disabled={isSaving || product.status === 'approved'}
            className={cn(
              'gap-1.5',
              product.status === 'approved'
                ? 'bg-success hover:bg-success/90'
                : 'bg-success hover:bg-success/90'
            )}
          >
            <Check className="w-4 h-4" />
            Approve
          </Button>
        </div>

        {/* Source Data Section */}
        <SourceDataViewer 
          shopifyProductId={String(product.shopify_product_id)} 
          parentVariantCount={product.product_content_variants}
        />

        {/* Variants Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Product Variants
          </h3>
          <VariantsTable
            variants={variants}
            isLoading={isLoadingVariants}
            onVariantUpdated={(updated) => {
              setVariants((prev) =>
                prev.map((v) => (v.id === updated.id ? updated : v))
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
