import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ImportExportClient } from './ImportExportClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Import & Export' }

export default async function ImportExportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch categories (system defaults + user's own)
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${user.id},is_default.eq.true`)
    .order('name')

  // Fetch tags
  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  // Fetch user profile for default currency
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_currency')
    .eq('id', user.id)
    .single()

  return (
    <ImportExportClient
      categories={categories ?? []}
      tags={tags ?? []}
      defaultCurrency={profile?.preferred_currency ?? 'INR'}
    />
  )
}
