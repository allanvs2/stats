import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClubsClient from '@/components/admin/AdminClubsClient'

// Define types for better TypeScript support - matching AdminClubsClient interfaces
interface Profile {
  full_name: string | null
  email: string
}

interface VikingsMember {
  id: string
  name: string | null
  surname: string | null
  member: string | null
  user_id: string | null
  profiles: Profile | null
}

interface JdaMember {
  id: string
  player_name: string | null
  user_id: string | null
  profiles: Profile | null
}

export default async function ClubsPage() {
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

  // Get all clubs with member counts
  const { data: clubs } = await supabase
    .from('clubs')
    .select(`
      *,
      club_memberships(count)
    `)
    .order('name')

  // Get all users - simple query
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .order('full_name')

  // Transform users to match expected interface - without complex memberships for now
  const users = allUsers?.map(user => ({
    ...user,
    club_memberships: [] // We'll populate this differently or handle in the client
  })) || []

  // Get existing player names from each club's data tables
  const { data: vikingsPlayers } = await supabase
    .from('vikings_friday')
    .select('name')
    .not('name', 'is', null)

  const { data: jdaPlayers } = await supabase
    .from('jda_stats')
    .select('player')
    .not('player', 'is', null)

  // Get unique player names
  const uniqueVikingsPlayers = Array.from(new Set(vikingsPlayers?.map(p => p.name).filter(Boolean) || []))
  const uniqueJdaPlayers = Array.from(new Set(jdaPlayers?.map(p => p.player).filter(Boolean) || []))

  // Get Vikings members - simplified
  const { data: vikingsMembers } = await supabase
    .from('vikings_members')
    .select('id, name, surname, member, user_id')

  // Add profile info to vikings members
  const vikingsMembersWithProfiles: VikingsMember[] = await Promise.all(
    (vikingsMembers || []).map(async (member) => {
      if (member.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
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

  // Get JDA members - handle if table doesn't exist
  let jdaMembersWithProfiles: JdaMember[] = []
  try {
    const { data: jdaMembers } = await supabase
      .from('jda_members')
      .select('id, player_name, user_id')

    jdaMembersWithProfiles = await Promise.all(
      (jdaMembers || []).map(async (member) => {
        if (member.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
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
  } catch {
    // Removed unused 'error' parameter and simplified catch block
    console.log('JDA members table not yet created')
    jdaMembersWithProfiles = []
  }

  // Get club statistics
  const [
    { count: vikingsFridayRecords },
    { count: vikingsMatchRecords },
    { count: vikingsMemberRecords },
    { count: jdaStatsRecords },
    { count: jdaLegsRecords },
    { count: jdaMatchRecords }
  ] = await Promise.all([
    supabase.from('vikings_friday').select('*', { count: 'exact', head: true }),
    supabase.from('vikings_matches').select('*', { count: 'exact', head: true }),
    supabase.from('vikings_members').select('*', { count: 'exact', head: true }),
    supabase.from('jda_stats').select('*', { count: 'exact', head: true }),
    supabase.from('jda_legs').select('*', { count: 'exact', head: true }),
    supabase.from('jda_matches').select('*', { count: 'exact', head: true })
  ])

  const clubStats = {
    vikings: {
      friday: vikingsFridayRecords || 0,
      matches: vikingsMatchRecords || 0,
      members: vikingsMemberRecords || 0
    },
    jda: {
      stats: jdaStatsRecords || 0,
      legs: jdaLegsRecords || 0,
      matches: jdaMatchRecords || 0
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Club Management</h1>
        <p className="text-gray-600">Manage clubs, create new clubs, and link users to player data</p>
      </div>

      <AdminClubsClient
        initialClubs={clubs || []}
        users={users}
        vikingsPlayers={uniqueVikingsPlayers}
        jdaPlayers={uniqueJdaPlayers}
        vikingsMembers={vikingsMembersWithProfiles}
        jdaMembers={jdaMembersWithProfiles}
        clubStats={clubStats}
      />
    </div>
  )
}