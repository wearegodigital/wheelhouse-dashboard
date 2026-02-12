"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import {
  CyberpunkSpinner,
  CyberpunkSpinnerText,
  CyberpunkSpinnerInline,
} from "@/components/ui/cyberpunk-spinner"

/**
 * Showcase component for all loading states and spinners.
 * Useful for testing and visual QA of the cyberpunk theme.
 *
 * Usage:
 * - Import and render this component on a test page
 * - Toggle between themes to see how loading states adapt
 * - Verify animations are smooth and effects render correctly
 */
export function LoadingShowcase() {
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [loading3, setLoading3] = useState(false)

  const simulateLoading = (
    setter: (v: boolean) => void,
    duration: number = 2000
  ) => {
    setter(true)
    setTimeout(() => setter(false), duration)
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Loading Components Showcase</h2>
        <p className="text-muted-foreground">
          Preview of all loading states and spinners. Toggle themes to see cyberpunk effects.
        </p>
      </div>

      {/* Spinner Sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Cyberpunk Spinner - All Sizes</CardTitle>
          <CardDescription>
            Four size variants: sm, md, lg, xl
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <CyberpunkSpinner size="sm" />
              <p className="text-xs mt-2 text-muted-foreground">Small</p>
            </div>
            <div className="text-center">
              <CyberpunkSpinner size="md" />
              <p className="text-xs mt-2 text-muted-foreground">Medium</p>
            </div>
            <div className="text-center">
              <CyberpunkSpinner size="lg" />
              <p className="text-xs mt-2 text-muted-foreground">Large</p>
            </div>
            <div className="text-center">
              <CyberpunkSpinner size="xl" />
              <p className="text-xs mt-2 text-muted-foreground">X-Large</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spinner Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Spinner Variants</CardTitle>
          <CardDescription>
            Different spinner presentations for various use cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Basic Spinner</h4>
            <CyberpunkSpinner />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Spinner with Text</h4>
            <CyberpunkSpinnerText text="Loading data..." />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Inline Spinner</h4>
            <CyberpunkSpinnerInline />
          </div>
        </CardContent>
      </Card>

      {/* Button Loading States */}
      <Card>
        <CardHeader>
          <CardTitle>Button Loading States</CardTitle>
          <CardDescription>
            Buttons with loading indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              loading={loading1}
              onClick={() => simulateLoading(setLoading1)}
            >
              Default Button
            </Button>

            <Button
              variant="secondary"
              loading={loading2}
              onClick={() => simulateLoading(setLoading2)}
              loadingText="Processing..."
            >
              Secondary Button
            </Button>

            <Button
              variant="destructive"
              loading={loading3}
              onClick={() => simulateLoading(setLoading3)}
            >
              Destructive Button
            </Button>

            <Button variant="outline" loading>
              Always Loading
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Loading */}
      <Card>
        <CardHeader>
          <CardTitle>Skeleton Loading</CardTitle>
          <CardDescription>
            Content placeholders with shimmer effect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </CardContent>
      </Card>

      {/* Card Skeleton */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Card Skeleton Loading</h3>
        <p className="text-sm text-muted-foreground">
          Used for list loading states
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton count={3} />
        </div>
      </div>

      {/* Loading States in Context */}
      <Card>
        <CardHeader>
          <CardTitle>Contextual Loading Examples</CardTitle>
          <CardDescription>
            How loading states appear in real components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Empty state with spinner */}
          <div className="border rounded-lg p-8">
            <div className="flex items-center justify-center">
              <CyberpunkSpinnerText text="Fetching comments..." />
            </div>
          </div>

          {/* Inline loading in a card */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Processing request</span>
              <CyberpunkSpinner size="sm" />
            </div>
          </div>

          {/* Form loading state */}
          <div className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <div className="flex justify-end">
              <Button loading size="sm">
                Submit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Page Loading */}
      <Card>
        <CardHeader>
          <CardTitle>Full Page Loading</CardTitle>
          <CardDescription>
            Center-aligned loading for page-level states
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg h-64 flex items-center justify-center bg-muted/30">
            <CyberpunkSpinnerText text="Initializing dashboard..." size="xl" />
          </div>
        </CardContent>
      </Card>

      {/* Theme Comparison Note */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>💡 Testing Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Toggle themes</strong> to see how loading states adapt:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              <strong>Default/Dark:</strong> Subtle animations, muted colors
            </li>
            <li>
              <strong>Cyberpunk:</strong> Neon glows, vibrant colors, enhanced effects
            </li>
          </ul>
          <p className="mt-4">
            <strong>Performance:</strong> All animations are GPU-accelerated using CSS
            transforms and opacity. No JavaScript animation loops.
          </p>
          <p>
            <strong>Accessibility:</strong> All spinners include proper ARIA labels
            and screen reader text.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
