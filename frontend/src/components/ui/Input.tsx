// src/components/ui/Input.tsx
import React from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva('flex h-10 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50', {
  variants: {
    variant: {
      default: 'border-border bg-surface',
      ghost: 'bg-transparent border-0',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & VariantProps<typeof inputVariants>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, variant, type = 'text', ...props }, ref) => (
  <input type={type} className={cn(inputVariants({ variant, className }))} ref={ref} {...props} />
));
Input.displayName = 'Input';

export { Input };
