import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from '@/components/admin/AnalyticsClient'

export default async function AnalyticsPage() {
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

  // Get comprehensive analytics data
  const [
    { count: totalUsers },
    { count: totalClubs },
    { count: vikingsFridayRecords },
    { count: vikingsMatchRecords },
    { count: vikingsMemberRecords },
    { count: jdaStatsRecords },
    { count: jdaLegsRecords },
    { count: jdaMatchRecords },
    { data: userGrowth },
    { data: vikingsTopPlayers },
    { data: jdaTopPlayers }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('clubs').select('*', { count: 'exact', head: true }),
    supabase.from('vikings_friday').select('*', { count: 'exact', head: true }),
    supabase.from('vikings_matches').select('*', { count: 'exact', head: true }),
    supabase.from('vikings_members').select('*', { count: 'exact', head: true }),
    supabase.from('jda_stats').select('*', { count: 'exact', head: true }),
    supabase.from('jda_legs').select('*', { count: 'exact', head: true }),
    supabase.from('jda_matches').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('created_at')
      .order('created_at'),
    supabase
      .from('vikings_friday')
      .select('name, average, one_eighty')
      .not('average', 'is', null)
      .order('average', { ascending: false })
      .limit(10),
    supabase
      .from('jda_stats')
      .select('player, average, one_eighty')
      .not('average', 'is', null)
      .order('average', { ascending: false })
      .limit(10)
  ])

  // Process data for charts
  const analyticsData = {
    totalUsers: totalUsers || 0,
    totalClubs: totalClubs || 0,
    vikingsFridayRecords: vikingsFridayRecords || 0,
    vikingsMatchRecords: vikingsMatchRecords || 0,
    vikingsMemberRecords: vikingsMemberRecords || 0,
    jdaStatsRecords: jdaStatsRecords || 0,
    jdaLegsRecords: jdaLegsRecords || 0,
    jdaMatchRecords: jdaMatchRecords || 0,
    userGrowth: userGrowth || [],
    vikingsTopPlayers: vikingsTopPlayers || [],
    jdaTopPlayers: jdaTopPlayers || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive platform statistics and insights</p>
      </div>

      <AnalyticsClient data={analyticsData} />
    </div>
  )
}