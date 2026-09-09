import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'nk-control flex w-full px-3.5 py-2.5 shadow-sm placeholder:text-school-muted-readable disabled:cursor-not-allowed disabled:bg-school-bg disabled:opacity-60 min-h-[110px]',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
