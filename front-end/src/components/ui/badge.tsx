import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold transition-[color,background-color,border-color,box-shadow,transform] shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-turquoise focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-line-turquoise bg-school-subtle text-ink-turquoise',
        secondary: 'border-line-blue bg-surface-blue text-ink-blue',
        destructive: 'border-school-error-border bg-school-error-bg text-school-error',
        outline: 'border-school-border bg-white text-school-body',
        success: 'border-school-success-border bg-school-success-bg text-school-success',
        warning: 'border-school-warning-border bg-school-warning-bg text-school-warning',
        purple: 'border-line-violet bg-surface-violet text-brand-violet',
        pink: 'border-line-pink bg-surface-pink text-ink-pink',
        lime: 'border-line-lime bg-surface-lime text-ink-lime',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
