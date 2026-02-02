"use client"
import { QueryProvider } from "./QueryProvider"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { ToastProvider } from "./ToastProvider"
import { ThemeProvider } from "./ThemeProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
