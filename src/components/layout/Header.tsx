"use client"
import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Settings, LogOut } from "lucide-react"

export function Header() {
  const { user, signOut, isLoading } = useAuth()

  const navLinkClasses = "transition-colors hover:text-foreground/80 [.cyberpunk_&]:text-foreground [.cyberpunk_&]:hover:text-primary [.cyberpunk_&]:hover:shadow-[0_0_8px_hsl(var(--primary)/0.5)] [.cyberpunk_&]:px-2 [.cyberpunk_&]:py-1 [.cyberpunk_&]:rounded [.cyberpunk_&]:transition-all [.cyberpunk_&]:duration-300"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 [.cyberpunk_&]:border-b-2 [.cyberpunk_&]:border-primary [.cyberpunk_&]:shadow-[0_2px_8px_hsl(var(--primary)/0.3)] [.cyberpunk_&]:scan-lines">
      <div className="container flex h-14 items-center">
        <Link href="/projects" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl [.cyberpunk_&]:neon-text [.cyberpunk_&]:text-primary [.cyberpunk_&]:tracking-wider">
            Wheelhouse
          </span>
        </Link>

        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          <Link href="/projects" className={navLinkClasses}>
            Projects
          </Link>
          <Link href="/tasks" className={navLinkClasses}>
            Tasks
          </Link>
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {!isLoading && user && (
            <>
              <span className="text-sm text-muted-foreground [.cyberpunk_&]:text-foreground/70">
                {user.email}
              </span>
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
