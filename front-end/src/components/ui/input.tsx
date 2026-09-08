import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 sm:h-11 w-full rounded-lg border border-[#718B88]/50 bg-white px-3.5 py-2 text-sm sm:text-base text-[#365451] shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#5E7A77]/60 focus-visible:outline-none focus-visible:border-[#087F79] focus-visible:ring-2 focus-visible:ring-[#087F79]/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
