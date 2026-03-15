import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const rawNext = searchParams.get("next") ?? "/projects"
  // Validate redirect target to prevent open redirect attacks
  const next = (
    rawNext.startsWith('/') &&
    !rawNext.startsWith('//') &&
    !rawNext.includes('://') &&
    !rawNext.includes('\\')
  ) ? rawNext : '/projects'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate`)
}
