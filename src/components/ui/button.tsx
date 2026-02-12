import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [.cyberpunk_&]:active:scale-95 [.cyberpunk_&]:hover:animate-[button-glitch_0.3s_ease-in-out] [.cyberpunk_&]:focus-visible:ring-[hsl(var(--primary))] [.cyberpunk_&]:focus-visible:ring-offset-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 [.cyberpunk_&]:shadow-[0_0_4px_hsl(var(--primary)/0.3)] [.cyberpunk_&]:hover:shadow-[0_0_8px_hsl(var(--primary)),0_0_16px_hsl(var(--primary)/0.5)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 [.cyberpunk_&]:shadow-[0_0_4px_hsl(var(--destructive)/0.3)] [.cyberpunk_&]:hover:shadow-[0_0_8px_hsl(var(--destructive)),0_0_16px_hsl(var(--destructive)/0.5)]",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground [.cyberpunk_&]:border-primary [.cyberpunk_&]:hover:bg-primary/10 [.cyberpunk_&]:hover:shadow-[0_0_6px_hsl(var(--primary)/0.4),inset_0_0_6px_hsl(var(--primary)/0.2)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 [.cyberpunk_&]:shadow-[0_0_2px_hsl(var(--accent)/0.3)] [.cyberpunk_&]:hover:shadow-[0_0_6px_hsl(var(--accent)),0_0_12px_hsl(var(--accent)/0.4)]",
        ghost: "hover:bg-accent hover:text-accent-foreground [.cyberpunk_&]:hover:bg-primary/10 [.cyberpunk_&]:hover:shadow-[0_0_4px_hsl(var(--primary)/0.3)] [.cyberpunk_&]:hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
