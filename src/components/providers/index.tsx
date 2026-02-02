"use client"
import { QueryProvider } from "./QueryProvider"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { ToastProvider } from "./ToastProvider"
import { ThemeProvider } from "./ThemeProvider"
import { TaskNotificationListener } from "@/components/notifications/TaskNotificationListener"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            <TaskNotificationListener />
            {children}
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
