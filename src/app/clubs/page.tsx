import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldIcon, StarIcon } from 'lucide-react'

// Correct types for Supabase nested queries
interface Club {
  id: string
  name: string
  description: string | null
  database_prefix: string
}

interface ClubMembershipFromSupabase {
  clubs: Club
}

export default async function ClubsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's clubs - Supabase returns { clubs: Club } structure
  const { data: userClubsData } = await supabase
    .from('club_memberships')
    .select(`
      clubs (
        id,
        name,
        description,
        database_prefix
      )
    `)
    .eq('user_id', user.id)

  // Get all available clubs
  const { data: allClubsData } = await supabase
    .from('clubs')
    .select('*')
    .order('name')

  // Type the data correctly
  const userClubs = userClubsData as ClubMembershipFromSupabase[] | null
  const allClubs = allClubsData as Club[] | null

  const userClubIds = userClubs?.map((membership) => membership.clubs.id) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dart Clubs</h1>
          <p className="text-gray-600">Choose a club to view your statistics and performance</p>
        </div>

        {userClubs && userClubs.length > 0 ? (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Your Clubs</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {userClubs.map((membership) => (
                  <Card key={membership.clubs.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {membership.clubs.name === 'Vikings' ? (
                          <ShieldIcon className="w-6 h-6 mr-2 text-blue-600" />
                        ) : (
                          <StarIcon className="w-6 h-6 mr-2 text-purple-600" />
                        )}
                        {membership.clubs.name}
                      </CardTitle>
                      <CardDescription>
                        {membership.clubs.description || 'Professional dart club statistics'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Link href={`/clubs/${membership.clubs.id}`} className="flex-1">
                          <Button className="w-full">
                            View Statistics
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No Club Membership</h3>
              <p className="text-gray-600 mb-4">
                You haven&apos;t been assigned to any clubs yet. Contact an administrator to join a club.
              </p>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Show all clubs for reference */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Available Clubs</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {allClubs?.map((club) => (
              <Card key={club.id} className={`${userClubIds.includes(club.id) ? 'ring-2 ring-green-500' : 'opacity-75'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {club.name === 'Vikings' ? (
                      <ShieldIcon className="w-6 h-6 mr-2 text-blue-600" />
                    ) : (
                      <StarIcon className="w-6 h-6 mr-2 text-purple-600" />
                    )}
                    {club.name}
                    {userClubIds.includes(club.id) && (
                      <span className="ml-auto text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        Member
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {club.description || 'Professional dart club'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userClubIds.includes(club.id) ? (
                    <Link href={`/clubs/${club.id}`}>
                      <Button className="w-full">View Your Stats</Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full">
                      Contact Admin to Join
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}