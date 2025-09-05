'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import VikingsDashboard from './VikingsDashboard'
import JDADashboard from './JDADashboard'

interface ClubDashboardProps {
  club: {
    id: string
    name: string
    database_prefix: string
    description?: string
  }
  userId: string
}

export default function ClubDashboard({ club, userId }: ClubDashboardProps) {
  const [data, setData] = useState<any>(null)
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
            friday: fridayData.data || [],
            matches: matchesData.data || [],
            members: memberData.data || []
          })
        } else if (club.name === 'JDA') {
          // Fetch JDA data
          const [statsData, legsData, matchesData] = await Promise.all([
            supabase.from('jda_stats').select('*').order('date', { ascending: false }).limit(50),
            supabase.from('jda_legs').select('*').order('date', { ascending: false }).limit(50),
            supabase.from('jda_matches').select('*').order('date', { ascending: false }).limit(50)
          ])
          
          setData({
            stats: statsData.data || [],
            legs: legsData.data || [],
            matches: matchesData.data || []
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
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">{club.name} Dart Club</h1>
        <p className="text-gray-600">{club.description || 'Professional dart club statistics'}</p>
      </div>

      {/* Club-specific Dashboard */}
      {club.name === 'Vikings' && <VikingsDashboard data={data} />}
      {club.name === 'JDA' && <JDADashboard data={data} />}
    </div>
  )
}