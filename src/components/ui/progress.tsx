"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-secondary/20",
  {
    variants: {
      variant: {
        default: "",
        gradient:
          "bg-gradient-to-r from-secondary/10 to-secondary/30",
        glass: "bg-white/10 backdrop-blur-sm",
        modern: "bg-secondary/10 backdrop-blur-sm",
      },
      size: {
        default: "h-4",
        xs: "h-1",
        sm: "h-2",
        lg: "h-6",
        xl: "h-8",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        default: "rounded-full",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

const progressIndicatorVariants = cva(
  "h-full transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        gradient:
          "bg-gradient-to-r from-primary to-secondary",
        glass: "bg-white/50 backdrop-blur-sm",
        modern: "bg-primary/50 backdrop-blur-sm",
      },
      animation: {
        default: "",
        smooth: "transition-[width] duration-300 ease-in-out",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        shine:
          "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
      animation: "smooth",
    },
  }
)

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number
  max?: number
  indicatorVariant?: VariantProps<typeof progressIndicatorVariants>["variant"]
  animation?: VariantProps<typeof progressIndicatorVariants>["animation"]
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100,
    variant, 
    size, 
    rounded,
    indicatorVariant,
    animation,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn(progressVariants({ variant, size, rounded }), className)}
        {...props}
      >
        <div
          className={cn(
            progressIndicatorVariants({ 
              variant: indicatorVariant || variant, 
              animation 
            })
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
