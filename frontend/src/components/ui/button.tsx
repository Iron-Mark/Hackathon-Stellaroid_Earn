// frontend/src/components/ui/button.tsx
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ctaHover } from "@/lib/motion";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-full font-sans font-semibold text-[15px] whitespace-nowrap",
    "border transition-colors duration-200",
    "cursor-pointer no-underline",
    "min-h-[44px] px-5",
    "focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2",
    "disabled:opacity-45 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-linear-to-r from-primary to-primary-hover",
          "text-on-primary border-primary",
        ],
        secondary: [
          "bg-surface-2 text-text border-border",
          "hover:bg-border",
        ],
        ghost: [
          "bg-transparent text-text border-transparent",
          "hover:bg-surface-2",
        ],
        outline: [
          "bg-transparent text-text border-border-glass",
          "hover:border-primary",
        ],
        danger: [
          "bg-danger text-text border-danger",
          "hover:opacity-85",
        ],
        warning: [
          "bg-transparent text-primary border-primary",
          "hover:bg-primary/10",
        ],
      },
      size: {
        default: "min-h-[44px] px-5 text-[15px]",
        sm: "min-h-[36px] px-3 text-[13px]",
        icon: "min-h-[44px] w-[44px] p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  href?: string;
  icon?: React.ReactNode;
}

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, icon, children, href, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);
    const isDisabled = disabled || loading;

    const inner = (
      <>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </>
    );

    if (href) {
      return (
        <motion.a
          href={href}
          className={classes}
          initial="rest"
          whileHover={isDisabled ? "rest" : "hover"}
          whileTap={isDisabled ? undefined : { scale: 0.97 }}
          variants={variant === "primary" ? ctaHover : undefined}
        >
          {inner}
        </motion.a>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={isDisabled}
        initial="rest"
        whileHover={isDisabled ? "rest" : "hover"}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        variants={variant === "primary" ? ctaHover : undefined}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {inner}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
