import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TagsClient } from './TagsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tags' }

export default async function TagsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return <TagsClient tags={tags ?? []} />
}
