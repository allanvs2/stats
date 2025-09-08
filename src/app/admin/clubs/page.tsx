import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Star, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'

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

  // Get club statistics
  const [
    { data: clubs },
    { count: vikingsFridayRecords },
    { count: vikingsMatchRecords },
    { count: vikingsMemberRecords },
    { count: jdaStatsRecords },
    { count: jdaLegsRecords },
    { count: jdaMatchRecords }
  ] = await Promise.all([
    supabase.from('clubs').select('*').order('name'),
    supabase.from('vikings_friday').select('*', { count: 'exact', head: true }),
    supabase.from('vikings_matches').select('*', { count: 'exact', head: true }),
    supabase.from('vikings_members').select('*', { count: 'exact', head: true }),
    supabase.from('jda_stats').select('*', { count: 'exact', head: true }),
    supabase.from('jda_legs').select('*', { count: 'exact', head: true }),
    supabase.from('jda_matches').select('*', { count: 'exact', head: true })
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Club Management</h1>
        <p className="text-gray-600">Overview and management of Vikings and JDA dart clubs</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Vikings Club */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-6 h-6 mr-2 text-blue-600" />
              Vikings Dart Club
            </CardTitle>
            <CardDescription>Friday sessions, matches, and member management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{vikingsFridayRecords || 0}</div>
                <div className="text-sm text-gray-600">Friday Records</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{vikingsMatchRecords || 0}</div>
                <div className="text-sm text-gray-600">Match Records</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{vikingsMemberRecords || 0}</div>
                <div className="text-sm text-gray-600">Members</div>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/admin/upload" className="block">
                <Button variant="outline" className="w-full">Upload Vikings Data</Button>
              </Link>
              <Button variant="outline" className="w-full" disabled>
                Manage Vikings Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* JDA Club */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-6 h-6 mr-2 text-purple-600" />
              JDA Dart Club
            </CardTitle>
            <CardDescription>Statistics, individual legs, and match tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{jdaStatsRecords || 0}</div>
                <div className="text-sm text-gray-600">Stat Records</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{jdaLegsRecords || 0}</div>
                <div className="text-sm text-gray-600">Leg Records</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{jdaMatchRecords || 0}</div>
                <div className="text-sm text-gray-600">Match Records</div>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/admin/upload" className="block">
                <Button variant="outline" className="w-full">Upload JDA Data</Button>
              </Link>
              <Button variant="outline" className="w-full" disabled>
                Manage JDA Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Club Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Club Administration</CardTitle>
          <CardDescription>Administrative actions for both clubs</CardDescription>
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
                <BarChart3 className="h-6 w-6 mb-2" />
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

      {/* Database Tables Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Database Overview</CardTitle>
          <CardDescription>Current data storage status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Vikings Tables</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>vikings_friday</span>
                  <span className="font-mono text-sm">{vikingsFridayRecords || 0} records</span>
                </div>
                <div className="flex justify-between">
                  <span>vikings_matches</span>
                  <span className="font-mono text-sm">{vikingsMatchRecords || 0} records</span>
                </div>
                <div className="flex justify-between">
                  <span>vikings_members</span>
                  <span className="font-mono text-sm">{vikingsMemberRecords || 0} records</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">JDA Tables</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>jda_stats</span>
                  <span className="font-mono text-sm">{jdaStatsRecords || 0} records</span>
                </div>
                <div className="flex justify-between">
                  <span>jda_legs</span>
                  <span className="font-mono text-sm">{jdaLegsRecords || 0} records</span>
                </div>
                <div className="flex justify-between">
                  <span>jda_matches</span>
                  <span className="font-mono text-sm">{jdaMatchRecords || 0} records</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}