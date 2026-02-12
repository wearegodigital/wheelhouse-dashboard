"use client"

import { useTheme } from "next-themes"
import { useCallback, useEffect, useRef } from "react"

export function useThemeTransition() {
  const { theme, setTheme: originalSetTheme } = useTheme()
  const transitionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create transition overlay element
    if (!transitionRef.current) {
      const overlay = document.createElement("div")
      overlay.className = "theme-transition-overlay"
      overlay.setAttribute("aria-hidden", "true")
      document.body.appendChild(overlay)
      transitionRef.current = overlay
    }

    return () => {
      if (transitionRef.current) {
        transitionRef.current.remove()
        transitionRef.current = null
      }
    }
  }, [])

  const setThemeWithTransition = useCallback(
    (newTheme: string) => {
      const overlay = transitionRef.current
      if (!overlay) {
        originalSetTheme(newTheme)
        return
      }

      // Use glitch effect for cyberpunk transitions
      const shouldGlitch = newTheme === "cyberpunk" || theme === "cyberpunk"
      const transitionClass = shouldGlitch ? "glitch" : "fade"
      const peakTime = shouldGlitch ? 150 : 100
      const duration = shouldGlitch ? 400 : 300

      overlay.classList.add("active", transitionClass)

      setTimeout(() => originalSetTheme(newTheme), peakTime)
      setTimeout(() => overlay.classList.remove("active", transitionClass), duration)
    },
    [theme, originalSetTheme]
  )

  return { theme, setTheme: setThemeWithTransition }
}
