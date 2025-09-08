import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomCSVUpload from '@/components/admin/CustomCSVUpload'

export default async function UploadPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Upload</h1>
        <p className="text-gray-600">Upload CSV files to Vikings and JDA club databases</p>
      </div>

      <div className="max-w-4xl">
        <CustomCSVUpload />
      </div>
    </div>
  )
}