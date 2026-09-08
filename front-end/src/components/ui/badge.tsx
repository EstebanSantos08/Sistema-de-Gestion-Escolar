import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#087F79] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-[#BBE5E1] bg-[#E3F5F3] text-[#087F79]',
        secondary: 'border-[#C7E5F6] bg-[#EFF7FC] text-[#1E7BB5]',
        destructive: 'border-[#F7C3C9] bg-[#FDF0F1] text-[#B42335]',
        outline: 'border-[#D6E5E3] bg-white text-[#365451]',
        success: 'border-[#C6E7C8] bg-[#EAF5EB] text-[#287A32]',
        warning: 'border-[#F6E4AC] bg-[#FEF8E7] text-[#805D00]',
        purple: 'border-[#E6CAED] bg-[#F6EDF8] text-[#9731AC]',
        pink: 'border-[#FCC8DF] bg-[#FDF0F6] text-[#D12B75]',
        lime: 'border-[#D6F09F] bg-[#F4FBE8] text-[#557D07]',
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
