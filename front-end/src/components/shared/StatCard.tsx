import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'turquoise' | 'pink' | 'lime' | 'yellow' | 'lightblue' | 'violet' | 'lilac';
  className?: string;
}

const variantStyles: Record<string, { iconBg: string; borderHover: string }> = {
  turquoise: { iconBg: 'bg-[#E3F5F3] text-[#087F79]', borderHover: 'hover:border-[#41C4BD]' },
  pink: { iconBg: 'bg-[#FDF0F6] text-[#FF5DA0]', borderHover: 'hover:border-[#FF5DA0]' },
  lime: { iconBg: 'bg-[#F4FBE8] text-[#719F0A]', borderHover: 'hover:border-[#9DD31B]' },
  yellow: { iconBg: 'bg-[#FEF9E6] text-[#C99E00]', borderHover: 'hover:border-[#F2C700]' },
  lightblue: { iconBg: 'bg-[#EFF7FC] text-[#3397D4]', borderHover: 'hover:border-[#64B6E5]' },
  violet: { iconBg: 'bg-[#F6EDF8] text-[#9731AC]', borderHover: 'hover:border-[#9731AC]' },
  lilac: { iconBg: 'bg-[#FDF0F6] text-[#EE7DCC]', borderHover: 'hover:border-[#EE7DCC]' },
};

export function StatCard({
  title,
  value,
  description,
  icon,
  variant = 'turquoise',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant] ?? variantStyles.turquoise;

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#D6E5E3] bg-white p-5 sm:p-6 shadow-xs transition-all hover:shadow-sm',
        styles.borderHover,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#5E7A77]">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#183B3A]">
            {value}
          </p>
          {description && (
            <p className="text-xs sm:text-sm text-[#5E7A77]">{description}</p>
          )}
        </div>
        {icon && (
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold', styles.iconBg)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
