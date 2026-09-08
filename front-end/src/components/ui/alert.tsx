import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4.5',
  {
    variants: {
      variant: {
        default: 'border-[#BBE5E1] bg-[#E3F5F3] text-[#41C4BD] [&>svg]:text-[#41C4BD]',
        destructive:
          'border-[#F7C3C9] bg-[#FDF0F1] text-[#B42335] [&>svg]:text-[#B42335]',
        success:
          'border-[#C6E7C8] bg-[#EAF5EB] text-[#287A32] [&>svg]:text-[#287A32]',
        warning:
          'border-[#F6E4AC] bg-[#FEF8E7] text-[#805D00] [&>svg]:text-[#805D00]',
        info:
          'border-[#C7E5F6] bg-[#EFF7FC] text-[#1E7BB5] [&>svg]:text-[#1E7BB5]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm opacity-90 [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
