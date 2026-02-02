"use client"
import { QueryProvider } from "./QueryProvider"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { ToastProvider } from "./ToastProvider"
import { ThemeProvider } from "./ThemeProvider"
import { TaskNotificationListener } from "@/components/notifications/TaskNotificationListener"
import { KeyboardShortcutsProvider } from "@/components/keyboard/KeyboardShortcutsProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            <KeyboardShortcutsProvider>
              <TaskNotificationListener />
              {children}
            </KeyboardShortcutsProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
