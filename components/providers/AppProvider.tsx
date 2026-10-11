'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category, Tag, Profile } from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'

interface AppContextValue {
  user: User | null
  profile: Profile | null
  categories: Category[]
  tags: Tag[]
  currency: string
  loading: boolean
  refreshCategories: () => Promise<void>
  refreshTags: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AppContext = createContext<AppContextValue>({
  user: null,
  profile: null,
  categories: [],
  tags: [],
  currency: 'INR',
  loading: true,
  refreshCategories: async () => {},
  refreshTags: async () => {},
  refreshProfile: async () => {},
})

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  const refreshProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single()
    if (data) setProfile(data)
  }, [supabase])

  const refreshCategories = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return
    const { data } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${currentUser.id},user_id.is.null`)
      .order('name')
    if (data) setCategories(data)
  }, [supabase])

  const refreshTags = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return
    const { data } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('name')
    if (data) setTags(data)
  }, [supabase])

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (!currentUser) {
          if (mounted) router.push('/login')
          return
        }

        if (mounted) setUser(currentUser)

        // Load profile, categories, and tags in parallel once
        const [profRes, catRes, tagRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
          supabase
            .from('categories')
            .select('*')
            .or(`user_id.eq.${currentUser.id},user_id.is.null`)
            .order('name'),
          supabase.from('tags').select('*').eq('user_id', currentUser.id).order('name'),
        ])

        if (mounted) {
          if (profRes.data) setProfile(profRes.data)
          if (catRes.data) setCategories(catRes.data)
          if (tagRes.data) setTags(tagRes.data)
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to initialize app state:', err)
        if (mounted) setLoading(false)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const currency = profile?.preferred_currency ?? 'INR'

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        categories,
        tags,
        currency,
        loading,
        refreshCategories,
        refreshTags,
        refreshProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
