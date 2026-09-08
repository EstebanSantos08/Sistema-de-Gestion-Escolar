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

const variantStyles: Record<string, { iconBg: string; borderHover: string; topBorder: string }> = {
  turquoise: { iconBg: 'bg-[#E3F5F3] text-[#41C4BD]', borderHover: 'hover:border-[#41C4BD]', topBorder: 'border-t-[#41C4BD]' },
  pink: { iconBg: 'bg-[#FDF0F6] text-[#FF5DA0]', borderHover: 'hover:border-[#FF5DA0]', topBorder: 'border-t-[#FF5DA0]' },
  lime: { iconBg: 'bg-[#F4FBE8] text-[#719F0A]', borderHover: 'hover:border-[#9DD31B]', topBorder: 'border-t-[#9DD31B]' },
  yellow: { iconBg: 'bg-[#FEF9E6] text-[#C99E00]', borderHover: 'hover:border-[#F2C700]', topBorder: 'border-t-[#F2C700]' },
  lightblue: { iconBg: 'bg-[#EFF7FC] text-[#3397D4]', borderHover: 'hover:border-[#64B6E5]', topBorder: 'border-t-[#64B6E5]' },
  violet: { iconBg: 'bg-[#F6EDF8] text-[#9731AC]', borderHover: 'hover:border-[#9731AC]', topBorder: 'border-t-[#9731AC]' },
  lilac: { iconBg: 'bg-[#FDF0F6] text-[#EE7DCC]', borderHover: 'hover:border-[#EE7DCC]', topBorder: 'border-t-[#EE7DCC]' },
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
        'rounded-3xl border border-[#D6E5E3] border-t-4 bg-white p-5 sm:p-6 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden relative',
        styles.topBorder,
        styles.borderHover,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-semibold text-[#5E7A77] uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-[#183B3A]">
            {value}
          </p>
          {description && (
            <p className="text-xs sm:text-sm font-medium text-[#5E7A77]">{description}</p>
          )}
        </div>
        {icon && (
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold shadow-2xs transition-transform duration-300 hover:rotate-6', styles.iconBg)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
