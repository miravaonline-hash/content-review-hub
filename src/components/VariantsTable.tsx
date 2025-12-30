import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit3, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ProductVariant } from '@/types/product';
import { updateProductVariant } from '@/services/nocodbApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VariantsTableProps {
  variants: ProductVariant[];
  isLoading: boolean;
  onVariantUpdated: (variant: ProductVariant) => void;
}

export function VariantsTable({ variants, isLoading, onVariantUpdated }: VariantsTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedSpecs, setEditedSpecs] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (variant: ProductVariant) => {
    setEditingId(variant.id);
    setEditedSpecs(variant.full_specification || '');
  };

  const handleSave = async (variant: ProductVariant) => {
    setIsSaving(true);
    try {
      const updated = await updateProductVariant(variant.id, {
        full_specification: editedSpecs,
      });
      onVariantUpdated({ ...variant, ...updated });
      setEditingId(null);
      toast.success('Variant updated');
    } catch (error) {
      console.error('Failed to save variant:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">No variants found for this product</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
              Variant
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
              Tech Specs Summary
            </th>
            <th className="w-24 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {variants.map((variant) => (
            <tr key={variant.id} className="group">
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {variant.variant_name || 'Unnamed Variant'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ID: {variant.shopify_variant_id}
                </p>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {variant.tech_specs_summary || 'No summary available'}
                </p>
              </td>
              <td className="px-4 py-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === variant.id ? null : variant.id)}
                  className="gap-1"
                >
                  {expandedId === variant.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Expanded Detail Panel */}
      {expandedId && (
        <div className="border-t border-border bg-muted/20 p-4 animate-fade-in">
          {(() => {
            const variant = variants.find((v) => v.id === expandedId);
            if (!variant) return null;

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">
                    Full Specification - {variant.variant_name}
                  </h4>
                  <div className="flex gap-2">
                    {editingId === variant.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                          disabled={isSaving}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSave(variant)}
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
                        onClick={() => handleEdit(variant)}
                        className="gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {editingId === variant.id ? (
                  <Textarea
                    value={editedSpecs}
                    onChange={(e) => setEditedSpecs(e.target.value)}
                    rows={10}
                    className="font-mono text-xs bg-background"
                    placeholder="Enter full specification HTML..."
                  />
                ) : variant.full_specification ? (
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <div
                      className="html-content"
                      dangerouslySetInnerHTML={{ __html: variant.full_specification }}
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <p className="text-sm text-muted-foreground italic">
                      No full specification available
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
