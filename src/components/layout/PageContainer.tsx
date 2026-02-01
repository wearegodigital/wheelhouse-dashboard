interface PageContainerProps {
  children: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
}

export function PageContainer({
  children,
  title,
  description,
  action
}: PageContainerProps) {
  return (
    <div className="container py-6">
      {(title || action) && (
        <div className="flex items-center justify-between mb-6">
          <div>
            {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
