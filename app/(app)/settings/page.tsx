import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch or initialize profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // If profile hasn't been created yet, insert default
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
        preferred_currency: 'INR',
        preferred_locale: 'en-IN',
        theme_preference: 'system',
      })
      .select()
      .single()
    profile = newProfile
  }

  return (
    <SettingsClient
      user={{ id: user.id, email: user.email ?? '' }}
      profile={
        profile ?? {
          id: user.id,
          display_name: user.email?.split('@')[0] ?? 'User',
          preferred_currency: 'INR',
          preferred_locale: 'en-IN',
          theme_preference: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
    />
  )
}
