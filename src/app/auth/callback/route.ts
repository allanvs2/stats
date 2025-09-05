import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successful authentication, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_error', request.url))
}