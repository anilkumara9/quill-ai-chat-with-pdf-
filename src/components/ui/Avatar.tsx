import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "",
        bordered: "ring-2 ring-ring",
        gradient: "bg-gradient-to-br from-primary to-secondary",
        glass: "bg-white/10 backdrop-blur-md",
        modern: "bg-secondary/10",
      },
      size: {
        xs: "h-6 w-6 text-[0.625rem]",
        sm: "h-8 w-8 text-xs",
        default: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
        "2xl": "h-20 w-20 text-xl",
      },
      status: {
        online: "after:absolute after:bottom-0 after:right-0 after:h-2.5 after:w-2.5 after:rounded-full after:border-2 after:border-background after:bg-success",
        offline: "after:absolute after:bottom-0 after:right-0 after:h-2.5 after:w-2.5 after:rounded-full after:border-2 after:border-background after:bg-muted",
        away: "after:absolute after:bottom-0 after:right-0 after:h-2.5 after:w-2.5 after:rounded-full after:border-2 after:border-background after:bg-warning",
        busy: "after:absolute after:bottom-0 after:right-0 after:h-2.5 after:w-2.5 after:rounded-full after:border-2 after:border-background after:bg-destructive",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        spin: "animate-spin",
        ping: "relative after:absolute after:inset-0 after:rounded-full after:animate-ping after:bg-current after:opacity-75",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
);

const avatarImageVariants = cva("aspect-square h-full w-full", {
  variants: {
    fit: {
      cover: "object-cover",
      contain: "object-contain",
      fill: "object-fill",
    },
  },
  defaultVariants: {
    fit: "cover",
  },
});

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  fit?: VariantProps<typeof avatarImageVariants>["fit"];
  onLoadingStatusChange?: (status: "loading" | "loaded" | "error") => void;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(
  (
    {
      className,
      variant,
      size,
      status,
      animation,
      src,
      alt,
      fallback,
      fit,
      onLoadingStatusChange,
      ...props
    },
    ref
  ) => {
    const [loadingStatus, setLoadingStatus] = React.useState<
      "loading" | "loaded" | "error"
    >("loading");

    React.useEffect(() => {
      onLoadingStatusChange?.(loadingStatus);
    }, [loadingStatus, onLoadingStatusChange]);

    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(avatarVariants({ variant, size, status, animation }), className)}
        {...props}
      >
        <AvatarPrimitive.Image
          src={src}
          alt={alt}
          onLoadingStatusChange={setLoadingStatus}
          className={cn(avatarImageVariants({ fit }))}
        />
        <AvatarPrimitive.Fallback
          delayMs={600}
          className="flex h-full w-full items-center justify-center bg-muted font-medium"
        >
          {fallback || alt?.slice(0, 2).toUpperCase() || "??"}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    );
  }
);
Avatar.displayName = AvatarPrimitive.Root.displayName;

export { Avatar }; 