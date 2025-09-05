import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClubDashboard from '@/components/clubs/ClubDashboard'

interface ClubPageProps {
  params: { id: string }
}

export default async function ClubPage({ params }: ClubPageProps) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get club details
  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!club) {
    redirect('/dashboard')
  }

  // Verify user is a member of this club
  const { data: membership } = await supabase
    .from('club_memberships')
    .select('*')
    .eq('user_id', user.id)
    .eq('club_id', params.id)
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ClubDashboard club={club} userId={user.id} />
      </div>
    </div>
  )
}