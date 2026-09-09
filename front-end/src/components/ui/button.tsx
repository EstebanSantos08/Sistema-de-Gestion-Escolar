import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'nk-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turquoise focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-school-primary text-white hover:bg-school-primary-hover active:bg-school-primary-active shadow-xs',
        destructive: 'bg-school-error text-white hover:bg-school-error-hover shadow-xs',
        outline: 'border border-school-border bg-white text-school-body hover:bg-school-subtle hover:text-ink-turquoise hover:border-brand-turquoise shadow-xs',
        context: 'nk-context-button',
        secondary: 'bg-school-subtle text-ink-turquoise hover:bg-school-subtle',
        ghost: 'text-school-body hover:bg-school-subtle hover:text-ink-turquoise',
        link: 'text-ink-turquoise underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 px-3 text-sm rounded-xl',
        lg: 'h-11 px-6 text-base rounded-lg',
        icon: 'h-11 w-11 rounded-xl',
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
