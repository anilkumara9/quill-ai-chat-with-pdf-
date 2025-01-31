"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const tooltipContentVariants = cva(
  "z-50 overflow-hidden rounded-md px-3 py-1.5 text-sm text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "bg-popover border shadow-md",
        glass: "bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 border shadow-lg",
        modern: "bg-gradient-to-br from-popover to-popover/80 backdrop-blur-sm border-0 shadow-lg",
        dark: "bg-gray-900 text-gray-50 dark:bg-gray-50 dark:text-gray-900 border-0 shadow-lg",
        brand: "bg-primary text-primary-foreground border-0 shadow-lg",
      },
      size: {
        default: "px-3 py-1.5",
        sm: "px-2 py-1 text-xs",
        lg: "px-4 py-2",
      },
      arrow: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      arrow: true,
    },
  }
)

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> &
    VariantProps<typeof tooltipContentVariants>
>(({ className, variant, size, arrow = true, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(tooltipContentVariants({ variant, size, arrow }), className)}
    {...props}
  >
    {props.children}
    {arrow && (
      <TooltipPrimitive.Arrow
        className={cn(
          "fill-current",
          variant === "glass" && "fill-white/90 dark:fill-gray-900/90",
          variant === "modern" && "fill-popover",
          variant === "dark" && "fill-gray-900 dark:fill-gray-50",
          variant === "brand" && "fill-primary"
        )}
        width={11}
        height={5}
      />
    )}
  </TooltipPrimitive.Content>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } 