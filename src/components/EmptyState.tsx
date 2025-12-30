import { MousePointerClick } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <MousePointerClick className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        Select a Product
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Choose a product from the list to view its details, review AI-generated content, and approve or reject changes.
      </p>
    </div>
  );
}
