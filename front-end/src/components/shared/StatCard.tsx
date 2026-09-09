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

export function StatCard({
  title,
  value,
  description,
  icon,
  variant = 'turquoise',
  className,
}: StatCardProps) {
  const accent = variant === 'lightblue' ? 'blue' : variant;

  return (
    <div
      className={cn(
        'nk-card nk-metric nk-lift p-5 sm:p-6',
        `accent-${accent}`,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-school-body">{title}</p>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums text-school-heading">
            {value}
          </p>
          {description && (
            <p className="text-sm font-medium text-school-muted-readable">{description}</p>
          )}
        </div>
        {icon && (
          <div className="nk-icon">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
