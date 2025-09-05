import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuthForm from '@/components/AuthForm'
import Link from 'next/link'

export default async function LoginPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="mt-2 text-gray-300">Sign in to your dart club account</p>
        </div>
        
        <AuthForm type="login" />
        
        <div className="text-center">
          <p className="text-gray-300">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-yellow-400 hover:underline font-semibold">
              Sign up here
            </Link>
          </p>
        </div>
        
        <div className="text-center">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}