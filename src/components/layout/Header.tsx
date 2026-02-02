"use client"
import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Settings, LogOut } from "lucide-react"

export function Header() {
  const { user, signOut, isLoading } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/projects" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl">Wheelhouse</span>
        </Link>

        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          <Link href="/projects" className="transition-colors hover:text-foreground/80">
            Projects
          </Link>
          <Link href="/tasks" className="transition-colors hover:text-foreground/80">
            Tasks
          </Link>
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {!isLoading && user && (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
