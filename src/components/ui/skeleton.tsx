import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        "cyberpunk:bg-gradient-to-r cyberpunk:from-primary/10 cyberpunk:via-accent/10 cyberpunk:to-primary/10 cyberpunk:bg-[length:200%_100%]",
        "cyberpunk:animate-[shimmer_2s_linear_infinite] cyberpunk:border cyberpunk:border-primary/20 cyberpunk:shadow-[0_0_10px_hsl(var(--primary)/0.3)]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
