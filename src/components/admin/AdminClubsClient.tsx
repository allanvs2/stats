'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Star, Users, BarChart3, Upload, Settings } from 'lucide-react'
import Link from 'next/link'

interface Club {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  database_prefix: string | null
  created_at: string
  club_memberships: { count: number }[]
}

interface ClubMembership {
  id: string
  club_id: string
  user_id: string
  role: string | null
  joined_at: string
}

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  club_memberships: ClubMembership[]
}

interface VikingsMember {
  id: string
  first_name: string | null
  last_name: string | null
  user_id: string | null
  profiles: {
    first_name: string | null
    last_name: string | null
    email: string
  } | null
}

interface JDAMember {
  id: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  user_id: string | null
  profiles: {
    first_name: string | null
    last_name: string | null
    email: string
  } | null
}

interface ClubStats {
  vikings: {
    friday: number
    matches: number
    members: number
  }
  jda: {
    stats: number
    legs: number
    matches: number
  }
}

interface AdminClubsClientProps {
  initialClubs: Club[]
  users: User[]
  vikingsPlayers: string[]
  jdaPlayers: string[]
  vikingsMembers: VikingsMember[]
  jdaMembers: JDAMember[]
  clubStats: ClubStats
}

export default function AdminClubsClient({ 
  initialClubs, 
  users, 
  vikingsPlayers, 
  jdaPlayers, 
  vikingsMembers,
  jdaMembers,
  clubStats
}: AdminClubsClientProps) {
  const [clubs, setClubs] = useState<Club[]>(initialClubs)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // New club form state
  const [newClub, setNewClub] = useState({
    name: '',
    description: '',
    database_prefix: ''
  })

  // Player linking state
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedClub, setSelectedClub] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [currentVikingsMembers, setCurrentVikingsMembers] = useState<VikingsMember[]>(vikingsMembers)
  const [currentJdaMembers, setCurrentJdaMembers] = useState<JDAMember[]>(jdaMembers)

  const supabase = createClient()

  // Helper function to get full name from user
  const getFullName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    } else if (user.first_name) {
      return user.first_name
    }
    return user.email
  }

  // Helper function to get full name from profile
  const getProfileName = (profile: { first_name: string | null, last_name: string | null, email: string } | null) => {
    if (!profile) return 'Unknown'
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    } else if (profile.first_name) {
      return profile.first_name
    }
    return profile.email
  }

  // Helper function to get full name from member
  const getMemberFullName = (member: VikingsMember | JDAMember) => {
    if ('display_name' in member && member.display_name) {
      return member.display_name
    }
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`
    }
    if (member.first_name) {
      return member.first_name
    }
    return null
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const refreshClubs = async () => {
    try {
      const { data } = await supabase
        .from('clubs')
        .select(`
          *,
          club_memberships(count)
        `)
        .order('name')
      
      if (data) {
        setClubs(data)
      }
    } catch (error) {
      console.error('Error refreshing clubs:', error)
    }
  }

  const refreshMembers = async () => {
    try {
      // Refresh Vikings members
      const { data: vikingsData } = await supabase
        .from('vikings_members')
        .select('id, first_name, last_name, user_id')

      if (vikingsData) {
        const vikingsMembersWithProfiles = await Promise.all(
          vikingsData.map(async (member) => {
            if (member.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, email')
                .eq('id', member.user_id)
                .single()
              
              return {
                ...member,
                profiles: profile || null
              }
            }
            return {
              ...member,
              profiles: null
            }
          })
        )
        setCurrentVikingsMembers(vikingsMembersWithProfiles)
      }

      // Refresh JDA members
      const { data: jdaData } = await supabase
        .from('jda_members')
        .select('id, first_name, last_name, display_name, user_id')

      if (jdaData) {
        const jdaMembersWithProfiles = await Promise.all(
          jdaData.map(async (member) => {
            if (member.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, email')
                .eq('id', member.user_id)
                .single()
              
              return {
                ...member,
                profiles: profile || null
              }
            }
            return {
              ...member,
              profiles: null
            }
          })
        )
        setCurrentJdaMembers(jdaMembersWithProfiles)
      }
    } catch (error) {
      console.error('Error refreshing members:', error)
    }
  }

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newClub.name || !newClub.database_prefix) {
      showMessage('error', 'Club name and database prefix are required')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('clubs')
        .insert({
          name: newClub.name,
          description: newClub.description || null,
          database_prefix: newClub.database_prefix
        })

      if (error) throw error

      await refreshClubs()
      setNewClub({ name: '', description: '', database_prefix: '' })
      showMessage('success', 'Club created successfully')
    } catch (error) {
      console.error('Error creating club:', error)
      showMessage('error', 'Failed to create club. Check if name or prefix already exists.')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkPlayer = async () => {
    if (!selectedUser || !selectedClub || !selectedPlayer) {
      showMessage('error', 'Please select a user, club, and player name')
      return
    }

    const club = clubs.find(c => c.id === selectedClub)
    if (!club) return

    setLoading(true)
    try {
      if (club.database_prefix === 'vikings') {
        // selectedPlayer is a full name from vikings_friday (e.g., "John Doe")
        // Find member by matching the full constructed name
        const existingMember = currentVikingsMembers.find(m => {
          const memberFullName = getMemberFullName(m)
          return memberFullName === selectedPlayer
        })
        
        if (existingMember) {
          // Update existing member with user_id
          const { error } = await supabase
            .from('vikings_members')
            .update({ user_id: selectedUser })
            .eq('id', existingMember.id)

          if (error) throw error
        } else {
          // Create new member - split the selected player name
          const nameParts = selectedPlayer.split(' ')
          const firstName = nameParts[0]
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null
          
          const { error } = await supabase
            .from('vikings_members')
            .insert({
              first_name: firstName,
              last_name: lastName,
              user_id: selectedUser
            })

          if (error) throw error
        }

        showMessage('success', 'Player linked successfully in Vikings club')
      } else if (club.database_prefix === 'jda') {
        // selectedPlayer is a full name from jda_stats
        const existingMember = currentJdaMembers.find(m => m.display_name === selectedPlayer)
        
        if (existingMember) {
          const { error } = await supabase
            .from('jda_members')
            .update({ user_id: selectedUser })
            .eq('id', existingMember.id)

          if (error) throw error
        } else {
          // Split name for first/last but keep full name as display_name
          const nameParts = selectedPlayer.split(' ')
          const firstName = nameParts[0]
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null
          
          const { error } = await supabase
            .from('jda_members')
            .insert({
              display_name: selectedPlayer,
              first_name: firstName,
              last_name: lastName,
              user_id: selectedUser
            })

          if (error) throw error
        }

        showMessage('success', 'Player linked successfully in JDA club')
      } else {
        showMessage('error', 'Unknown club type for player linking')
      }

      await refreshMembers()
      setSelectedUser('')
      setSelectedClub('')
      setSelectedPlayer('')
    } catch (error) {
      console.error('Error linking player:', error)
      showMessage('error', `Failed to link player: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkPlayer = async (clubType: 'vikings' | 'jda', memberId: string) => {
    if (!confirm('Are you sure you want to unlink this player?')) {
      return
    }

    setLoading(true)
    try {
      const tableName = clubType === 'vikings' ? 'vikings_members' : 'jda_members'
      const { error } = await supabase
        .from(tableName)
        .update({ user_id: null })
        .eq('id', memberId)

      if (error) throw error

      await refreshMembers()
      showMessage('success', 'Player unlinked successfully')
    } catch (error) {
      console.error('Error unlinking player:', error)
      showMessage('error', 'Failed to unlink player')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClub = async (clubId: string, clubName: string) => {
    if (!confirm(`Are you sure you want to delete ${clubName}? This action cannot be undone and will remove all associated memberships.`)) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId)

      if (error) throw error

      await refreshClubs()
      showMessage('success', 'Club deleted successfully')
    } catch (error) {
      console.error('Error deleting club:', error)
      showMessage('error', 'Failed to delete club')
    } finally {
      setLoading(false)
    }
  }

  const getAvailablePlayersForClub = (clubId: string) => {
    const club = clubs.find(c => c.id === clubId)
    if (club?.database_prefix === 'vikings') {
      return vikingsPlayers
    } else if (club?.database_prefix === 'jda') {
      return jdaPlayers
    }
    return []
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="create">Create Club</TabsTrigger>
          <TabsTrigger value="link">Link Players</TabsTrigger>
          <TabsTrigger value="manage">Manage Links</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {clubs.map((club) => (
              <Card key={club.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      {club.name === 'Vikings Dart Club' ? (
                        <Shield className="w-6 h-6 mr-2 text-blue-600" />
                      ) : club.name === 'JDA Dart Club' ? (
                        <Star className="w-6 h-6 mr-2 text-purple-600" />
                      ) : (
                        <Users className="w-6 h-6 mr-2 text-green-600" />
                      )}
                      {club.name}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClub(club.id, club.name)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </CardTitle>
                  <CardDescription>{club.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Database Prefix:</span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {club.database_prefix || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Members:</span>
                      <span className="font-semibold">
                        {club.club_memberships?.[0]?.count || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Players:</span>
                      <span>
                        {club.database_prefix === 'vikings' && `${vikingsPlayers.length} players`}
                        {club.database_prefix === 'jda' && `${jdaPlayers.length} players`}
                        {!club.database_prefix && 'No player data'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Link href="/admin/upload" className="block">
                      <Button variant="outline" className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload {club.name} Data
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full" disabled={loading}>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Club Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Club Administration</CardTitle>
              <CardDescription>Administrative actions for all clubs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full h-20 flex flex-col">
                    <Users className="h-6 w-6 mb-2" />
                    Assign Users to Clubs
                  </Button>
                </Link>
                <Link href="/admin/upload">
                  <Button variant="outline" className="w-full h-20 flex flex-col">
                    <Upload className="h-6 w-6 mb-2" />
                    Upload Statistics
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button variant="outline" className="w-full h-20 flex flex-col">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    View Analytics
                  </Button>
                </Link>
                <Button variant="outline" className="w-full h-20 flex flex-col" disabled>
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Vikings Club Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-blue-600" />
                  Vikings Club Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{clubStats.vikings.friday}</div>
                    <div className="text-sm text-gray-600">Friday Records</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{clubStats.vikings.matches}</div>
                    <div className="text-sm text-gray-600">Match Records</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{clubStats.vikings.members}</div>
                    <div className="text-sm text-gray-600">Members</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* JDA Club Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-6 h-6 mr-2 text-purple-600" />
                  JDA Club Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{clubStats.jda.stats}</div>
                    <div className="text-sm text-gray-600">Stat Records</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{clubStats.jda.legs}</div>
                    <div className="text-sm text-gray-600">Leg Records</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{clubStats.jda.matches}</div>
                    <div className="text-sm text-gray-600">Match Records</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Club</h2>
            <form onSubmit={handleCreateClub} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="club-name">Club Name</Label>
                  <Input
                    id="club-name"
                    type="text"
                    value={newClub.name}
                    onChange={(e) => setNewClub(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Knights Dart Club"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="database-prefix">Database Prefix</Label>
                  <Input
                    id="database-prefix"
                    type="text"
                    value={newClub.database_prefix}
                    onChange={(e) => setNewClub(prev => ({ ...prev, database_prefix: e.target.value.toLowerCase() }))}
                    placeholder="e.g., knights"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used for database table naming (lowercase, no spaces)
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="club-description">Description (Optional)</Label>
                <Input
                  id="club-description"
                  type="text"
                  value={newClub.description}
                  onChange={(e) => setNewClub(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the club"
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Club'}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="link" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Link User to Player Data</h2>
            <p className="text-gray-600 mb-6">
              Connect registered users to existing player names in your club statistics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="user-select-link">Select User</Label>
                <select
                  id="user-select-link"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {getFullName(user)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="club-select-link">Select Club</Label>
                <select
                  id="club-select-link"
                  value={selectedClub}
                  onChange={(e) => {
                    setSelectedClub(e.target.value)
                    setSelectedPlayer('')
                  }}
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
                <Label htmlFor="player-select-link">Select Player Name</Label>
                <select
                  id="player-select-link"
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  disabled={!selectedClub}
                  className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Choose a player...</option>
                  {getAvailablePlayersForClub(selectedClub).map((player) => (
                    <option key={player} value={player}>
                      {player}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Button 
                  onClick={handleLinkPlayer} 
                  disabled={loading || !selectedUser || !selectedClub || !selectedPlayer}
                >
                  {loading ? 'Linking...' : 'Link Player'}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Player Links</h2>
            <p className="text-gray-600 mb-6">
              View and manage existing links between users and player data.
            </p>

            {/* Vikings Links */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Vikings Club Player Links</h3>
              <div className="space-y-2">
                {currentVikingsMembers.filter(m => m.user_id).map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-blue-50 rounded p-3">
                    <div>
                      <span className="font-medium">{getMemberFullName(member) || 'Unknown'}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        → {getProfileName(member.profiles)} ({member.profiles?.email})
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnlinkPlayer('vikings', member.id)}
                      disabled={loading}
                    >
                      Unlink
                    </Button>
                  </div>
                ))}
                
                {currentVikingsMembers.filter(m => m.user_id).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No Vikings player links found</p>
                )}
              </div>
            </div>

            {/* JDA Links */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">JDA Club Player Links</h3>
              <div className="space-y-2">
                {currentJdaMembers.filter(m => m.user_id).map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-purple-50 rounded p-3">
                    <div>
                      <span className="font-medium">{member.display_name || getMemberFullName(member) || 'Unknown'}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        → {getProfileName(member.profiles)} ({member.profiles?.email})
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnlinkPlayer('jda', member.id)}
                      disabled={loading}
                    >
                      Unlink
                    </Button>
                  </div>
                ))}
                
                {currentJdaMembers.filter(m => m.user_id).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No JDA player links found</p>
                )}
              </div>
            </div>

            {/* Unlinked Players */}
            <div>
              <h3 className="font-medium mb-3">Unlinked Players</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Vikings Players</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {currentVikingsMembers.filter(m => !m.user_id).map((member) => (
                      <div key={member.id} className="bg-gray-50 rounded p-2 text-sm">
                        {getMemberFullName(member) || 'Unnamed'}
                      </div>
                    ))}
                    
                    {vikingsPlayers.filter(player => 
                      !currentVikingsMembers.some(m => getMemberFullName(m) === player)
                    ).map((player) => (
                      <div key={player} className="bg-yellow-50 rounded p-2 text-sm">
                        {player} <span className="text-xs text-gray-500">(stats only)</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">JDA Players</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {currentJdaMembers.filter(m => !m.user_id).map((member) => (
                      <div key={member.id} className="bg-gray-50 rounded p-2 text-sm">
                        {member.display_name || getMemberFullName(member) || 'Unnamed'}
                      </div>
                    ))}
                    
                    {jdaPlayers.filter(player => 
                      !currentJdaMembers.some(m => m.display_name === player)
                    ).map((player) => (
                      <div key={player} className="bg-yellow-50 rounded p-2 text-sm">
                        {player} <span className="text-xs text-gray-500">(stats only)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}