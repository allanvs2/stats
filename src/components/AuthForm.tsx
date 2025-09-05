'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface AuthFormProps {
  type: 'login' | 'signup'
}

export default function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      if (type === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })
        
        if (error) throw error
        
        if (data.user && !data.user.email_confirmed_at) {
          setMessage('Check your email to confirm your account!')
          setMessageType('success')
        } else {
          setMessage('Account created successfully!')
          setMessageType('success')
          setTimeout(() => router.push('/dashboard'), 2000)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        setMessage('Login successful! Redirecting...')
        setMessageType('success')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      setMessage(errorMessage)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {type === 'signup' && (
        <div>
          <Label htmlFor="fullName" className="text-white">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 bg-white/20 border-white/30 text-white placeholder-gray-300"
            placeholder="Enter your full name"
            disabled={loading}
          />
        </div>
      )}
      
      <div>
        <Label htmlFor="email" className="text-white">Email Address</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 bg-white/20 border-white/30 text-white placeholder-gray-300"
          placeholder="Enter your email"
          disabled={loading}
        />
      </div>
      
      <div>
        <Label htmlFor="password" className="text-white">Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 bg-white/20 border-white/30 text-white placeholder-gray-300"
          placeholder="Enter your password"
          disabled={loading}
          minLength={6}
        />
        {type === 'signup' && (
          <p className="text-gray-400 text-sm mt-1">Password must be at least 6 characters</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-md transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {type === 'login' ? 'Signing in...' : 'Creating account...'}
          </>
        ) : (
          type === 'login' ? 'Sign In' : 'Create Account'
        )}
      </Button>

      {message && (
        <div className={`flex items-center p-4 rounded-md ${
          messageType === 'error' 
            ? 'bg-red-100/20 border border-red-500/30 text-red-300' 
            : 'bg-green-100/20 border border-green-500/30 text-green-300'
        }`}>
          {messageType === 'error' ? (
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          )}
          <p className="text-sm">{message}</p>
        </div>
      )}

      {type === 'signup' && (
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            By creating an account, you&apos;ll be able to access statistics for Vikings and JDA dart clubs once assigned by an administrator.
          </p>
        </div>
      )}
    </form>
  )
}