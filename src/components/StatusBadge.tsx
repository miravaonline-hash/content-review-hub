import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-smooth',
        status === 'approved' && 'bg-success-muted text-success',
        status === 'pending' && 'bg-warning-muted text-warning',
        status === 'rejected' && 'bg-destructive/10 text-destructive',
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          status === 'approved' && 'bg-success',
          status === 'pending' && 'bg-warning',
          status === 'rejected' && 'bg-destructive'
        )}
      />
      {status === 'approved' && 'Approved'}
      {status === 'pending' && 'Pending'}
      {status === 'rejected' && 'Rejected'}
    </span>
  );
}
