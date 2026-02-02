import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface ShortcutConfig {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  description: string
  action: () => void
}

export const shortcuts: Omit<ShortcutConfig, "action">[] = [
  { key: "g", description: "Go to Projects", ctrlKey: false },
  { key: "t", description: "Go to Tasks", ctrlKey: false },
  { key: "s", description: "Go to Settings", ctrlKey: false },
  { key: "n", description: "New Project", ctrlKey: false },
  { key: "/", description: "Show keyboard shortcuts", ctrlKey: false },
  { key: "Escape", description: "Close modal/dialog", ctrlKey: false },
]

export function useKeyboardShortcuts(
  onOpenHelp: () => void,
  enabled: boolean = true
) {
  const router = useRouter()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      // Don't trigger if modifier keys are pressed (except for designated shortcuts)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      switch (event.key.toLowerCase()) {
        case "g":
          event.preventDefault()
          router.push("/projects")
          break
        case "t":
          event.preventDefault()
          router.push("/tasks")
          break
        case "s":
          event.preventDefault()
          router.push("/settings")
          break
        case "n":
          event.preventDefault()
          router.push("/projects/new")
          break
        case "/":
        case "?":
          event.preventDefault()
          onOpenHelp()
          break
      }
    },
    [router, onOpenHelp]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown, enabled])
}
