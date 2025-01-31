import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
        default: "min-h-[80px]",
        sm: "min-h-[60px] px-2 text-xs",
        lg: "min-h-[120px] px-4 text-base",
      },
      error: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
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
      resize: "vertical",
      fullWidth: true,
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, error, resize, fullWidth, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, size, error, resize, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea }; 