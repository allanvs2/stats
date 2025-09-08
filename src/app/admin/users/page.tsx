import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
        clubs(name, id)
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

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">User Management Tools</h2>
        <p className="text-gray-600 mb-4">
          Found {users?.length || 0} users and {clubs?.length || 0} clubs in the system.
        </p>
        
        {/* Simple user list for now */}
        <div className="space-y-2">
          <h3 className="font-medium">Users:</h3>
          {users?.map((user) => (
            <div key={user.id} className="border p-3 rounded">
              <div className="font-medium">{user.full_name || 'No Name'}</div>
              <div className="text-sm text-gray-600">{user.email}</div>
              <div className="text-sm text-gray-500">Role: {user.role}</div>
            </div>
          ))}
        </div>

        {/* Simple clubs list */}
        <div className="space-y-2 mt-6">
          <h3 className="font-medium">Clubs:</h3>
          {clubs?.map((club) => (
            <div key={club.id} className="border p-3 rounded">
              <div className="font-medium">{club.name}</div>
              <div className="text-sm text-gray-600">{club.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}