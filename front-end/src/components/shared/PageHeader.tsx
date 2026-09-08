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
        'mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative',
        className
      )}
    >
      <div className="space-y-1.5">
        {eyebrow && (
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E3F5F3] text-[#41C4BD] border border-[#BBE5E1] text-xs font-bold uppercase tracking-wider shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#41C4BD] animate-pulse" />
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#183B3A] flex items-center gap-2">
          <span>{title}</span>
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-[#5E7A77] max-w-3xl">
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
