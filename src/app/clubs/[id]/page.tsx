import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ClubDashboard from '@/components/clubs/ClubDashboard'

interface Props {
  params: {
    id: string
  }
}

export default async function ClubPage({ params }: Props) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get the club details
  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!club) {
    notFound()
  }

  // Check if user has access to this club
  const { data: membership } = await supabase
    .from('club_memberships')
    .select('*')
    .eq('user_id', user.id)
    .eq('club_id', params.id)
    .single()

  // If user is not admin and not a member of this club, redirect
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!membership && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return <ClubDashboard club={club} userId={user.id} />
}