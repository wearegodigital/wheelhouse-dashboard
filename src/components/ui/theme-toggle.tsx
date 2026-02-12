"use client"

import { Moon, Sun, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useThemeTransition } from "@/hooks/use-theme-transition"

export function ThemeToggle() {
  const { setTheme } = useThemeTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] transition-all dark:hidden [.cyberpunk_&]:hidden" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] hidden dark:block [.cyberpunk_&]:hidden" />
          <Zap className="absolute h-[1.2rem] w-[1.2rem] hidden [.cyberpunk_&]:block" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("cyberpunk")}>
          Cyberpunk
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
