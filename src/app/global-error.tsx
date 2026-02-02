"use client"

import { useEffect } from "react"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background text-foreground">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4 mb-4">
            <svg
              className="h-10 w-10 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Application Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            A critical error occurred. Please try refreshing the page.
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
          {error.digest && (
            <p className="mt-6 text-xs text-gray-500">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
