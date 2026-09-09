import { cn } from '@/lib/utils';

interface GradeBadgeProps {
  passed: boolean;
  className?: string;
}

export function GradeBadge({ passed, className }: GradeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        passed
          ? 'border-school-success-border bg-school-success-bg text-school-success'
          : 'border-school-error-border bg-school-error-bg text-school-error',
        className
      )}
    >
      {passed ? 'Aprobado' : 'Reprobado'}
    </span>
  );
}
