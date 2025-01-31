import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        ghost: "border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
        modern: "border-0 bg-secondary/10 focus-visible:ring-1 focus-visible:bg-secondary/20",
        underline: "rounded-none border-0 border-b border-input px-0 focus-visible:ring-0 focus-visible:border-primary",
        gradient: "border-0 bg-gradient-to-r from-primary/5 to-secondary/5 focus-visible:from-primary/10 focus-visible:to-secondary/10",
      },
      size: {
        default: "h-10",
        sm: "h-8 px-2 text-xs",
        lg: "h-12 px-4 text-base",
      },
      error: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      error: false,
      fullWidth: true,
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: boolean;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, error, fullWidth, leftElement, rightElement, type, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {leftElement && (
          <div className="absolute left-3 flex items-center text-muted-foreground">
            {leftElement}
          </div>
        )}
        <input
          type={type}
          className={cn(
            inputVariants({ variant, size, error, fullWidth, className }),
            leftElement && "pl-10",
            rightElement && "pr-10"
          )}
          ref={ref}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center text-muted-foreground">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
