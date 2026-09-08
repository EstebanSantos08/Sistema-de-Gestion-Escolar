import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#41C4BD] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#41C4BD] text-white hover:bg-[#3AA8A2] active:bg-[#05524E] shadow-xs',
        destructive: 'bg-[#B42335] text-white hover:bg-[#971D2C] shadow-xs',
        outline: 'border border-[#D6E5E3] bg-white text-[#365451] hover:bg-[#E3F5F3] hover:text-[#41C4BD] hover:border-[#41C4BD] shadow-xs',
        secondary: 'bg-[#E3F5F3] text-[#41C4BD] hover:bg-[#D4EFEA]',
        ghost: 'text-[#365451] hover:bg-[#E3F5F3] hover:text-[#41C4BD]',
        link: 'text-[#41C4BD] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs sm:text-sm rounded-md',
        lg: 'h-11 px-6 text-base rounded-lg',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
