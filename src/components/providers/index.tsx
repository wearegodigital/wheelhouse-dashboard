"use client"
import { QueryProvider } from "./QueryProvider"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { ToastProvider } from "./ToastProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
