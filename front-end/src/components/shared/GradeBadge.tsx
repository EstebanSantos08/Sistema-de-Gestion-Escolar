import { cn } from '@/lib/utils';

interface GradeBadgeProps {
  passed: boolean;
  className?: string;
}

export function GradeBadge({ passed, className }: GradeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        passed
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800',
        className
      )}
    >
      {passed ? 'APROBADO' : 'REPROBADO'}
    </span>
  );
}
