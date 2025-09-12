import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserManagementClient from '@/components/admin/UserManagementClient'

export default async function UsersPage() {
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

  // Get all users with their club memberships
  const { data: users } = await supabase
    .from('profiles')
    .select(`
      *,
      club_memberships(
        id,
        joined_at,
        clubs(
          id,
          name,
          description
        )
      )
    `)
    .order('created_at', { ascending: false })

  // Get all clubs for assignment
  const { data: clubs } = await supabase
    .from('clubs')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage user accounts and club assignments</p>
      </div>

      <UserManagementClient 
        initialUsers={users || []} 
        clubs={clubs || []} 
      />
    </div>
  )
}