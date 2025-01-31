import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva("animate-pulse rounded-md bg-muted", {
  variants: {
    variant: {
      default: "",
      shimmer:
        "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent",
      wave:
        "relative overflow-hidden before:absolute before:inset-0 before:animate-[wave_2s_cubic-bezier(0.4,0,0.6,1)_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent",
      pulse: "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]",
      gradient:
        "bg-gradient-to-r from-muted via-muted/80 to-muted animate-[gradient_2s_ease-in-out_infinite]",
    },
    rounded: {
      none: "rounded-none",
      sm: "rounded-sm",
      default: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "default",
    rounded: "default",
  },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

function Skeleton({
  className,
  variant,
  rounded,
  width,
  height,
  circle,
  style,
  ...props
}: SkeletonProps) {
  const styles = {
    ...style,
    width: width,
    height: height || (circle ? width : undefined),
    borderRadius: circle ? "50%" : undefined,
  };

  return (
    <div
      className={cn(skeletonVariants({ variant, rounded }), className)}
      style={styles}
      {...props}
    />
  );
}

export { Skeleton }; 