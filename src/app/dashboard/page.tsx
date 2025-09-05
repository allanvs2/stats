import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldIcon, StarIcon, BarChart3Icon, TrendingUpIcon, UsersIcon, CalendarIcon } from 'lucide-react'

interface Club {
  id: string
  name: string
  description: string | null
  database_prefix: string
}

interface ClubMembershipFromSupabase {
  joined_at: string
  clubs: Club
}

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  updated_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  // Get user's clubs with membership info
  const { data: clubsData } = await supabase
    .from('club_memberships')
    .select(`
      joined_at,
      clubs (
        id,
        name,
        description,
        database_prefix
      )
    `)
    .eq('user_id', user.id)

  const clubs = clubsData as ClubMembershipFromSupabase[] | null

  // Get recent activity summary
  const recentStats = {
    totalClubs: clubs?.length || 0,
    memberSince: clubs?.[0]?.joined_at ? new Date(clubs[0].joined_at).toLocaleDateString() : 'N/A'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {profile?.full_name || user.email}!</p>
            </div>
            <div className="flex items-center space-x-4">
              {profile?.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline">Admin Panel</Button>
                </Link>
              )}
              <div className="text-right">
                <p className="text-sm text-gray-500">Member since</p>
                <p className="font-semibold">{recentStats.memberSince}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Club Memberships</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentStats.totalClubs}</div>
              <p className="text-xs text-muted-foreground">Active clubs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Type</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{profile?.role || 'User'}</div>
              <p className="text-xs text-muted-foreground">Access level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Login</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Today</div>
              <p className="text-xs text-muted-foreground">Active session</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stats</CardTitle>
              <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">View</div>
              <p className="text-xs text-muted-foreground">Available data</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {clubs && clubs.length > 0 ? (
          <div className="space-y-8">
            {/* Your Clubs Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Dart Clubs</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {clubs.map((membership) => (
                  <Card key={membership.clubs.id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          {membership.clubs.name === 'Vikings' ? (
                            <ShieldIcon className="w-6 h-6 mr-3 text-blue-600" />
                          ) : (
                            <StarIcon className="w-6 h-6 mr-3 text-purple-600" />
                          )}
                          <div>
                            <h3 className="text-xl font-bold">{membership.clubs.name}</h3>
                            <p className="text-sm text-gray-500 font-normal">
                              Joined {new Date(membership.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Active
                          </span>
                        </div>
                      </CardTitle>
                      <CardDescription className="text-base">
                        {membership.clubs.name === 'Vikings' 
                          ? 'Friday sessions, match tracking, and member performance analytics'
                          : 'Comprehensive statistics, individual legs tracking, and bonus point system'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {membership.clubs.name === 'Vikings' ? 'Friday' : 'Stats'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {membership.clubs.name === 'Vikings' ? 'Sessions' : 'Tracking'}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-purple-600">
                            {membership.clubs.name === 'Vikings' ? 'Matches' : 'Legs'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {membership.clubs.name === 'Vikings' ? 'Results' : 'Individual'}
                          </div>
                        </div>
                      </div>
                      <Link href={`/clubs/${membership.clubs.id}`}>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <BarChart3Icon className="w-4 h-4 mr-2" />
                          View {membership.clubs.name} Stats
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <BarChart3Icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">View All Statistics</h3>
                    <p className="text-gray-600 text-sm mb-4">Access comprehensive performance data</p>
                    <Link href="/clubs">
                      <Button variant="outline" className="w-full">Browse Clubs</Button>
                    </Link>
                  </CardContent>
                </Card>

                {profile?.role === 'admin' && (
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <UsersIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Admin Panel</h3>
                      <p className="text-gray-600 text-sm mb-4">Manage users and upload data</p>
                      <Link href="/admin">
                        <Button variant="outline" className="w-full">Open Admin</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                <Card className="text-center">
                  <CardContent className="pt-6">
                    <TrendingUpIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Performance Trends</h3>
                    <p className="text-gray-600 text-sm mb-4">Track your improvement over time</p>
                    <Button variant="outline" className="w-full" disabled>
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          // No clubs assigned
          <Card className="text-center py-12">
            <CardContent>
              <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Club Memberships</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You haven&apos;t been assigned to any clubs yet. Contact your administrator to join Vikings or JDA dart club and start tracking your performance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {profile?.role === 'admin' ? (
                  <Link href="/admin/users">
                    <Button>Manage Users</Button>
                  </Link>
                ) : (
                  <Button disabled>Contact Administrator</Button>
                )}
                <Link href="/clubs">
                  <Button variant="outline">View Available Clubs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}