"use client"
import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Settings, LogOut, Trash2, Users } from "lucide-react"

export function Header() {
  const { user, signOut, isLoading } = useAuth()

  const navLinkClasses = "transition-colors hover:text-foreground/80 [.cyberpunk_&]:text-foreground [.cyberpunk_&]:hover:text-primary [.cyberpunk_&]:hover:shadow-[0_0_8px_hsl(var(--primary)/0.5)] [.cyberpunk_&]:px-2 [.cyberpunk_&]:py-1 [.cyberpunk_&]:rounded [.cyberpunk_&]:transition-all [.cyberpunk_&]:duration-300"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 [.cyberpunk_&]:border-b-2 [.cyberpunk_&]:border-primary [.cyberpunk_&]:shadow-[0_2px_8px_hsl(var(--primary)/0.3)] [.cyberpunk_&]:scan-lines">
      <div className="w-full max-w-7xl mx-auto px-6 flex h-14 items-center">
        <Link href="/delegate" className="mr-6 flex items-center space-x-2">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Outer wheel rim */}
            <ellipse cx="12" cy="18" rx="8" ry="2.5" />
            {/* Vase/bowl body */}
            <path d="M4 18 C4 18 5 10 8 7 C9.5 5.5 12 5 12 5 C12 5 14.5 5.5 16 7 C19 10 20 18 20 18" />
            {/* Clay center / navel of wheel */}
            <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
            {/* Wheel spokes */}
            <line x1="12" y1="18" x2="4" y2="18" />
            <line x1="12" y1="18" x2="20" y2="18" />
            <line x1="12" y1="18" x2="12" y2="21" />
          </svg>
          <span className="font-bold text-xl [.cyberpunk_&]:neon-text [.cyberpunk_&]:text-primary [.cyberpunk_&]:tracking-wider">
            Wheelhouse
          </span>
        </Link>

        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          <Link href="/delegate" className={navLinkClasses}>
            Home
          </Link>
          <Link href="/clients" className={navLinkClasses}>
            <span className="flex items-center gap-1"><Users className="h-4 w-4" />Clients</span>
          </Link>
          <Link href="/projects" className={navLinkClasses}>
            Projects
          </Link>
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {!isLoading && user && (
            <>
              <span className="text-sm text-muted-foreground [.cyberpunk_&]:text-foreground/70">
                {user.email}
              </span>
              <Link href="/trash">
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Link>
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
