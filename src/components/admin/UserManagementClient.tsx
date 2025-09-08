'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { User, Crown, Mail, Calendar, Users } from 'lucide-react'

interface Club {
  id: string
  name: string
  description?: string
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  club_memberships?: {
    clubs: Club
  }[]
}

interface UserManagementClientProps {
  initialUsers: UserProfile[]
  clubs: Club[]
}

export default function UserManagementClient({ initialUsers, clubs }: UserManagementClientProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Create new user form
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user',
    clubId: ''
  })

  const supabase = createClient()

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.fullName
          }
        }
      })

      if (authError) {
        throw authError
      }

      if (authData.user) {
        // Update role if not default
        if (newUser.role !== 'user') {
          const { error: roleError } = await supabase
            .from('profiles')
            .update({ role: newUser.role })
            .eq('id', authData.user.id)

          if (roleError) {
            console.error('Error updating role:', roleError)
          }
        }

        // Add club membership if selected
        if (newUser.clubId) {
          const { error: membershipError } = await supabase
            .from('club_memberships')
            .insert({
              user_id: authData.user.id,
              club_id: newUser.clubId
            })

          if (membershipError) {
            console.error('Error adding club membership:', membershipError)
          }
        }

        setMessage('User created successfully!')
        setNewUser({ email: '', password: '', fullName: '', role: 'user', clubId: '' })
        
        // Refresh users list
        const { data: updatedUsers } = await supabase
          .from('profiles')
          .select(`
            *,
            club_memberships(
              clubs(name, id)
            )
          `)
          .order('created_at', { ascending: false })

        if (updatedUsers) {
          setUsers(updatedUsers)
        }
      }
       } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setMessage(`Error: ${errorMessage}`)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) {
        throw error
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
      setMessage('User role updated successfully!')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setMessage(`Error: ${errorMessage}`)
    }
    setLoading(false)
  }

  const handleClubAssignment = async (userId: string, clubId: string) => {
    setLoading(true)
    try {
      // First remove existing memberships
      await supabase
        .from('club_memberships')
        .delete()
        .eq('user_id', userId)

      // Add new membership if club selected
      if (clubId) {
        const { error } = await supabase
          .from('club_memberships')
          .insert({
            user_id: userId,
            club_id: clubId
          })

        if (error) {
          throw error
        }
      }

      setMessage('Club assignment updated successfully!')
      
      // Refresh users list
      const { data: updatedUsers } = await supabase
        .from('profiles')
        .select(`
          *,
          club_memberships(
            clubs(name, id)
          )
        `)
        .order('created_at', { ascending: false })

      if (updatedUsers) {
        setUsers(updatedUsers)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setMessage(`Error: ${errorMessage}`)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message}
        </div>
      )}

      {/* Create New User */}
      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>Add a new user account to the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="club">Club (Optional)</Label>
                <Select value={newUser.clubId} onValueChange={(value) => setNewUser({ ...newUser, clubId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a club" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Club</SelectItem>
                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Users</CardTitle>
          <CardDescription>Manage roles and club assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{user.full_name || 'No Name'}</h3>
                        {user.role === 'admin' && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                        {user.club_memberships && user.club_memberships.length > 0 && (
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {user.club_memberships[0].clubs.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <Label className="text-xs">Role</Label>
                      <Select 
                        value={user.role} 
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Club</Label>
                      <Select 
                        value={user.club_memberships?.[0]?.clubs.id || ''} 
                        onValueChange={(value) => handleClubAssignment(user.id, value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="No Club" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Club</SelectItem>
                          {clubs.map((club) => (
                            <SelectItem key={club.id} value={club.id}>
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}