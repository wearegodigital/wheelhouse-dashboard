import { cn } from "@/lib/utils"

interface CyberCornersProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const SIZE_MAP = {
  sm: "w-2 h-2",
  md: "w-4 h-4",
  lg: "w-8 h-8",
}

export function CyberCorners({ className, size = "sm" }: CyberCornersProps) {
  const sizeClass = SIZE_MAP[size]
  const baseClass = cn("absolute border-current opacity-60 pointer-events-none", sizeClass, className)

  return (
    <>
      <div className={cn(baseClass, "top-0 left-0 border-t-2 border-l-2")} />
      <div className={cn(baseClass, "top-0 right-0 border-t-2 border-r-2")} />
      <div className={cn(baseClass, "bottom-0 left-0 border-b-2 border-l-2")} />
      <div className={cn(baseClass, "bottom-0 right-0 border-b-2 border-r-2")} />
    </>
  )
}
