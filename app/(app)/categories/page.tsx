import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CategoriesClient } from './CategoriesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Categories' }

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order('is_default', { ascending: false })
    .order('name')

  return <CategoriesClient categories={categories ?? []} />
}
