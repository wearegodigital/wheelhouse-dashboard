"use client"

import { useState, createContext, useContext, useCallback, ReactNode } from "react"
import { useKeyboardShortcuts, shortcuts } from "@/hooks/useKeyboardShortcuts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Keyboard } from "lucide-react"

interface KeyboardShortcutsContextType {
  openHelp: () => void
  closeHelp: () => void
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null)

export function useKeyboardShortcutsHelp() {
  const context = useContext(KeyboardShortcutsContext)
  if (!context) {
    throw new Error("useKeyboardShortcutsHelp must be used within KeyboardShortcutsProvider")
  }
  return context
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const openHelp = useCallback(() => setIsOpen(true), [])
  const closeHelp = useCallback(() => setIsOpen(false), [])

  useKeyboardShortcuts(openHelp)

  return (
    <KeyboardShortcutsContext.Provider value={{ openHelp, closeHelp }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Press these keys anywhere to navigate quickly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between"
              >
                <span className="text-sm">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded border">
                  {shortcut.key === "/" ? "?" : shortcut.key.toUpperCase()}
                </kbd>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> to close
          </p>
        </DialogContent>
      </Dialog>
    </KeyboardShortcutsContext.Provider>
  )
}
