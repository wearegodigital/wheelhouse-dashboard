"use client"
import { QueryProvider } from "./QueryProvider"
import { AuthProvider } from "@/components/auth/AuthProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  )
}
