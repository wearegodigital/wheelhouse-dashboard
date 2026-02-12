import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 cyberpunk:shadow-glow-sm cyberpunk:hover:shadow-glow",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 cyberpunk:shadow-glow-xs cyberpunk:hover:shadow-glow-sm",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 cyberpunk:shadow-glow cyberpunk:hover:shadow-glow-lg cyberpunk:animate-pulse",
        outline: "text-foreground cyberpunk:border-primary cyberpunk:text-primary cyberpunk:shadow-glow-xs",
        success: "border-transparent bg-green-500 text-white cyberpunk:bg-[hsl(var(--success))] cyberpunk:text-success-foreground cyberpunk:shadow-glow cyberpunk:hover:shadow-glow-lg",
        warning: "border-transparent bg-yellow-500 text-white cyberpunk:bg-[hsl(var(--warning))] cyberpunk:text-warning-foreground cyberpunk:shadow-glow cyberpunk:hover:shadow-glow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
