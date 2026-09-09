import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'course';
}

export function PageHeader({
  title,
  description,
  eyebrow,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'nk-page-header mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative',
        className
      )}
    >
      <div className="space-y-1.5">
        {eyebrow && (
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-school-subtle text-ink-turquoise border border-line-turquoise text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-brand-turquoise" />
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-school-heading flex items-center gap-2">
          <span>{title}</span>
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-school-muted-readable max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
