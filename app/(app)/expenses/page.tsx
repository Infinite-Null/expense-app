import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExpensesClient } from './ExpensesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Expenses',
}

export default async function ExpensesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Load categories and tags for filters
  const [{ data: categories }, { data: tags }, { data: profile }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, color')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('name'),
    supabase
      .from('tags')
      .select('id, name, color')
      .eq('user_id', user.id)
      .order('name'),
    supabase
      .from('profiles')
      .select('preferred_currency')
      .eq('id', user.id)
      .single(),
  ])

  return (
    <ExpensesClient
      categories={categories ?? []}
      tags={tags ?? []}
      currency={profile?.preferred_currency ?? 'INR'}
    />
  )
}
