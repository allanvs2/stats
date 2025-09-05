import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuthForm from '@/components/AuthForm'
import Link from 'next/link'

export default async function SignUpPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Join Your Club</h2>
          <p className="mt-2 text-gray-300">Create your account to access dart statistics</p>
        </div>
        
        <AuthForm type="signup" />
        
        <div className="text-center">
          <p className="text-gray-300">
            Already have an account?{' '}
            <Link href="/login" className="text-yellow-400 hover:underline font-semibold">
              Sign in here
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