import { cn } from "@/lib/utils"

interface EmptyStateProps {
  message: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ message, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-lg border border-dashed p-8 text-center", className)}>
      {icon && <div className="mb-4">{icon}</div>}
      <p className="text-muted-foreground">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
