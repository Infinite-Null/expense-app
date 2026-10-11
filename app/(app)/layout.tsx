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
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar
        userEmail={user.email}
        displayName={profile?.display_name}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <main
          className="flex-1 min-w-0 pb-36 sm:pb-28 md:pb-14 px-4 sm:px-6 md:px-10 lg:px-12 pt-5 sm:pt-6 md:pt-9 max-w-6xl w-full mx-auto"
          id="main-content"
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
