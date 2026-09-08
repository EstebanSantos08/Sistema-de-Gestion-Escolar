import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[96px] w-full rounded-lg border border-[#718B88]/50 bg-white px-3.5 py-2.5 text-sm sm:text-base text-[#365451] shadow-xs transition-colors placeholder:text-[#5E7A77]/60 focus-visible:outline-none focus-visible:border-[#087F79] focus-visible:ring-2 focus-visible:ring-[#087F79]/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
