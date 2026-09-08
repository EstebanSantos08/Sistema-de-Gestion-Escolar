import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#D6E5E3] bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-[#41C4BD]/60 hover:shadow-sm',
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E3F5F3] text-[#087F79]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
