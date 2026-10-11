import { createClient } from '@/lib/supabase/server'
import { Sidebar, MobileNav } from '@/components/layout/Sidebar'
import { redirect } from 'next/navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Load profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <Sidebar
        userEmail={user.email}
        displayName={profile?.display_name}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <main
          className="flex-1 min-w-0 pb-24 md:pb-12 px-4 sm:px-6 md:px-8 pt-4 md:pt-8 max-w-6xl w-full mx-auto"
          id="main-content"
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
