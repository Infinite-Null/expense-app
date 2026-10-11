import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsClient } from './AnalyticsClient'
import { getCurrentMonthRange } from '@/lib/utils/dates'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { from, to } = getCurrentMonthRange()

  const [{ data: categories }, { data: tags }, { data: profile }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, color')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('name'),
    supabase.from('tags').select('id, name, color').eq('user_id', user.id).order('name'),
    supabase.from('profiles').select('preferred_currency').eq('id', user.id).single(),
  ])

  return (
    <AnalyticsClient
      categories={categories ?? []}
      tags={tags ?? []}
      currency={profile?.preferred_currency ?? 'INR'}
      defaultFrom={from}
      defaultTo={to}
    />
  )
}
