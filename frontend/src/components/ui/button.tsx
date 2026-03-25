import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import buttonVariants from "./button-variants"
import type { VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={type}
        // Ensure proper role when using asChild
        role={asChild ? "button" : undefined}
        // Ensure tab navigation works properly
        tabIndex={asChild ? 0 : undefined}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
