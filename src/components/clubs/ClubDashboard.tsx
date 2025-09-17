'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import VikingsDashboard from './VikingsDashboard'
import JDADashboard from './JDADashboard'

interface Club {
  id: string
  name: string
  database_prefix: string
  description?: string
}

interface VikingsData {
  friday: VikingsFridayRecord[]
  matches: VikingsMatchRecord[]
  members: VikingsMemberRecord[]
}

interface JDAData {
  stats: JDAStatsRecord[]
  legs: JDALegsRecord[]
  matches: JDAMatchRecord[]
}

interface VikingsFridayRecord {
  id: string
  date: string | null
  name: string | null
  points: number | null
  games: number | null
  won: number | null
  lost: number | null
  darts_thrown: number | null
  score_left: number | null
  average: number | null
  one_eighty: number | null
  one_seventy_one: number | null
  high_closer: number | null
  winner: number
  block: string | null
  season: string | null
  created_at: string
}

interface VikingsMatchRecord {
  id: string
  date: string | null
  player: string | null
  against: string | null
  legs: number | null
  ave: number | null
  result: string | null
  created_at: string
}

interface VikingsMemberRecord {
  id: string
  name: string | null
  surname: string | null
  member: string | null
  season: number | null
  color: string | null
  user_id: string | null
  created_at: string
}

interface JDAStatsRecord {
  id: string
  date: string | null
  player: string | null
  bonus: number | null
  points: number | null
  games: number | null
  won: number | null
  lost: number | null
  darts: number | null
  score_left: number | null
  average: number | null
  one_eighty: number | null
  one_seventy_one: number | null
  closer: number | null
  closer1: number
  closer2: number
  block_position: number | null
  block: string | null
  created_at: string
}

interface JDALegsRecord {
  id: string
  date: string | null
  player: string | null
  opponent: string | null
  darts: number | null
  score_left: number | null
  result: string | null
  created_at: string
}

interface JDAMatchRecord {
  id: string
  date: string | null
  player: string | null
  opponent: string | null
  legs: number | null
  ave: number | null
  result: string | null
  created_at: string
}

interface ClubDashboardProps {
  club: Club
  userId: string
}

export default function ClubDashboard({ club }: ClubDashboardProps) {
  const [data, setData] = useState<VikingsData | JDAData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchClubData() {
      setLoading(true)
      
      try {
        if (club.name === 'Vikings') {
          // Fetch Vikings data
          const [fridayData, matchesData, memberData] = await Promise.all([
            supabase.from('vikings_friday').select('*').order('date', { ascending: false }).limit(50),
            supabase.from('vikings_matches').select('*').order('date', { ascending: false }).limit(50),
            supabase.from('vikings_members').select('*')
          ])
          
          setData({
            friday: fridayData.data as VikingsFridayRecord[] || [],
            matches: matchesData.data as VikingsMatchRecord[] || [],
            members: memberData.data as VikingsMemberRecord[] || []
          })
        } else if (club.name === 'JDA') {
          // Fetch JDA data
          const [statsData, legsData, matchesData] = await Promise.all([
            supabase.from('jda_stats').select('*').order('date', { ascending: false }).limit(50),
            supabase.from('jda_legs').select('*').order('date', { ascending: false }).limit(50),
            supabase.from('jda_matches').select('*').order('date', { ascending: false }).limit(50)
          ])
          
          setData({
            stats: statsData.data as JDAStatsRecord[] || [],
            legs: legsData.data as JDALegsRecord[] || [],
            matches: matchesData.data as JDAMatchRecord[] || []
          })
        }
      } catch (error) {
        console.error('Error fetching club data:', error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchClubData()
  }, [club, supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
        <p className="text-gray-600">Unable to load club statistics at this time.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Club Header */}
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">{club.name} Dart Club</h1>
        <p className="text-gray-600">{club.description || 'Professional dart club statistics'}</p>
      </div>

      {/* Club-specific Dashboard */}
      {club.name === 'Vikings' && <VikingsDashboard/>}
      {club.name === 'JDA' && <JDADashboard data={data as JDAData} />}
    </div>
  )
}