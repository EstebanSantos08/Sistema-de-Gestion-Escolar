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
          ? 'border-[#C6E7C8] bg-[#EAF5EB] text-[#287A32]'
          : 'border-[#F7C3C9] bg-[#FDF0F1] text-[#B42335]',
        className
      )}
    >
      {passed ? 'Aprobado' : 'Reprobado'}
    </span>
  );
}
