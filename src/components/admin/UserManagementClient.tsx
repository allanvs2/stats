'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface Club {
  id: string
  name: string
  description: string | null
}

interface ClubMembership {
  id: string
  joined_at: string
  clubs: Club
}

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  club_memberships: ClubMembership[]
}

interface Props {
  initialUsers: User[]
  clubs: Club[]
}

export default function UserManagementClient({ initialUsers, clubs }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedClub, setSelectedClub] = useState<string>('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form states for creating new user
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user'
  })

  const supabase = createClient()

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const refreshUsers = async () => {
    try {
      const { data } = await supabase
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
      
      if (data) {
        setUsers(data)
      }
    } catch (error) {
      console.error('Error refreshing users:', error)
    }
  }

  const handleAssignToClub = async () => {
    if (!selectedUser || !selectedClub) {
      showMessage('error', 'Please select both a user and a club')
      return
    }

    setLoading(true)
    try {
      // Check if user is already in this club
      const existingMembership = users.find(u => u.id === selectedUser)
        ?.club_memberships?.find(m => m.clubs.id === selectedClub)
      
      if (existingMembership) {
        showMessage('error', 'User is already a member of this club')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('club_memberships')
        .insert({
          user_id: selectedUser,
          club_id: selectedClub
        })

      if (error) throw error

      await refreshUsers()
      setSelectedUser('')
      setSelectedClub('')
      showMessage('success', 'User successfully assigned to club')
    } catch (error) {
      console.error('Error assigning user to club:', error)
      showMessage('error', 'Failed to assign user to club')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromClub = async (userId: string, membershipId: string, clubName: string) => {
    if (!confirm(`Are you sure you want to remove this user from ${clubName}?`)) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('club_memberships')
        .delete()
        .eq('id', membershipId)

      if (error) throw error

      await refreshUsers()
      showMessage('success', `User removed from ${clubName}`)
    } catch (error) {
      console.error('Error removing user from club:', error)
      showMessage('error', 'Failed to remove user from club')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      await refreshUsers()
      showMessage('success', 'User role updated successfully')
    } catch (error) {
      console.error('Error updating user role:', error)
      showMessage('error', 'Failed to update user role')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      showMessage('error', 'Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Update role if not 'user'
        if (newUser.role !== 'user') {
          const { error: roleError } = await supabase
            .from('profiles')
            .update({ role: newUser.role })
            .eq('id', authData.user.id)
          
          if (roleError) throw roleError
        }
      }

      await refreshUsers()
      setNewUser({ email: '', password: '', full_name: '', role: 'user' })
      setShowCreateForm(false)
      showMessage('success', 'User created successfully')
    } catch (error) {
      console.error('Error creating user:', error)
      showMessage('error', 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Message display */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{clubs.length}</div>
            <div className="text-sm text-gray-600">Active Clubs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {users.reduce((acc, user) => acc + user.club_memberships.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Club Memberships</div>
          </div>
        </div>
      </Card>

      {/* Create User Card */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New User</h2>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant={showCreateForm ? "outline" : "default"}
          >
            {showCreateForm ? 'Cancel' : 'Create User'}
          </Button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        )}
      </Card>

      {/* Club Assignment Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Assign User to Club</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="user-select">Select User</Label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="club-select">Select Club</Label>
            <select
              id="club-select"
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Choose a club...</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Button 
              onClick={handleAssignToClub} 
              disabled={loading || !selectedUser || !selectedClub}
            >
              {loading ? 'Assigning...' : 'Assign to Club'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Users List Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Users & Club Memberships</h2>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-medium text-lg">
                      {user.full_name || 'No Name'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{user.email}</p>
                  
                  {/* Club memberships */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Club Memberships:</h4>
                    {user.club_memberships.length > 0 ? (
                      <div className="space-y-2">
                        {user.club_memberships.map((membership) => (
                          <div key={membership.id} className="flex items-center justify-between bg-blue-50 rounded p-2">
                            <div>
                              <span className="font-medium text-sm">{membership.clubs.name}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                Joined: {new Date(membership.joined_at).toLocaleDateString()}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveFromClub(
                                user.id, 
                                membership.id, 
                                membership.clubs.name
                              )}
                              disabled={loading}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No club memberships</p>
                    )}
                  </div>
                </div>

                {/* Role selector */}
                <div className="ml-4">
                  <Label htmlFor={`role-${user.id}`} className="text-xs">Role</Label>
                  <select
                    id={`role-${user.id}`}
                    value={user.role}
                    onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                    disabled={loading}
                    className="flex h-8 w-24 rounded-md border border-input px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found in the system.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}