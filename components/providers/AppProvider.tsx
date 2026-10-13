'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category, Tag, Profile, Space } from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'

interface AppContextValue {
  user: User | null
  profile: Profile | null
  categories: Category[]
  tags: Tag[]
  spaces: Space[]
  currentSpace: Space | null
  isAllSpaces: boolean
  currency: string
  loading: boolean
  setCurrentSpace: (space: Space | null) => void
  createSpace: (name: string, icon?: string | null, color?: string | null) => Promise<Space | null>
  updateSpace: (id: string, updates: { name: string; icon?: string | null; color?: string | null }) => Promise<Space | null>
  deleteSpace: (id: string) => Promise<{ success: boolean; error?: string }>
  refreshCategories: () => Promise<void>
  refreshTags: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshSpaces: () => Promise<void>
}

const AppContext = createContext<AppContextValue>({
  user: null,
  profile: null,
  categories: [],
  tags: [],
  spaces: [],
  currentSpace: null,
  isAllSpaces: false,
  currency: 'INR',
  loading: true,
  setCurrentSpace: () => {},
  createSpace: async () => null,
  updateSpace: async () => null,
  deleteSpace: async () => ({ success: false }),
  refreshCategories: async () => {},
  refreshTags: async () => {},
  refreshProfile: async () => {},
  refreshSpaces: async () => {},
})

const STORAGE_KEY = 'spendly_active_space_id'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [currentSpace, setCurrentSpaceState] = useState<Space | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  const setCurrentSpace = useCallback((space: Space | null) => {
    setCurrentSpaceState(space)
    if (typeof window !== 'undefined') {
      try {
        if (space) {
          localStorage.setItem(STORAGE_KEY, space.id)
        } else {
          localStorage.setItem(STORAGE_KEY, 'all')
        }
      } catch (e) {
        console.error('Failed to store active space in localStorage:', e)
      }
    }
  }, [])

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

  const refreshSpaces = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return
    try {
      const { data } = await supabase
        .from('spaces')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at')
      if (data && data.length > 0) {
        setSpaces(data)
      }
    } catch (e) {
      console.warn('Failed to refresh spaces:', e)
    }
  }, [supabase])

  const createSpace = useCallback(
    async (name: string, icon?: string | null, color?: string | null): Promise<Space | null> => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return null

      try {
        const { data, error } = await supabase
          .from('spaces')
          .insert({
            user_id: currentUser.id,
            name: name.trim(),
            icon: icon || 'layers',
            color: color || '#4F46E5',
            is_default: false,
          })
          .select()
          .single()

        if (error || !data) {
          console.error('Error creating space:', error)
          return null
        }

        setSpaces((prev) => [...prev, data])
        setCurrentSpace(data)
        return data
      } catch (err) {
        console.error('createSpace exception:', err)
        return null
      }
    },
    [supabase, setCurrentSpace]
  )

  const updateSpace = useCallback(
    async (
      id: string,
      updates: { name: string; icon?: string | null; color?: string | null }
    ): Promise<Space | null> => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) return null

      try {
        const { data, error } = await supabase
          .from('spaces')
          .update({
            name: updates.name.trim(),
            icon: updates.icon || 'layers',
            color: updates.color || '#4F46E5',
          })
          .eq('id', id)
          .eq('user_id', currentUser.id)
          .select()
          .single()

        if (error || !data) {
          console.error('Error updating space:', error)
          return null
        }

        setSpaces((prev) => prev.map((s) => (s.id === id ? data : s)))
        setCurrentSpaceState((prev) => (prev?.id === id ? data : prev))
        return data
      } catch (err) {
        console.error('updateSpace exception:', err)
        return null
      }
    },
    [supabase]
  )

  const deleteSpace = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) return { success: false, error: 'Not authenticated' }

      const targetSpace = spaces.find((s) => s.id === id)
      if (!targetSpace) return { success: false, error: 'Space not found' }
      if (targetSpace.is_default) {
        return { success: false, error: 'The default space cannot be deleted.' }
      }
      if (spaces.length <= 1) {
        return { success: false, error: 'You must have at least one space.' }
      }

      try {
        // Find default space or fallback to first other space
        const defaultSpace =
          spaces.find((s) => s.is_default && s.id !== id) || spaces.find((s) => s.id !== id)
        if (!defaultSpace) return { success: false, error: 'No fallback space available.' }

        // 1. Delete all expenses belonging to this space
        const { error: expensesDeleteError } = await supabase
          .from('expenses')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('space_id', id)

        if (expensesDeleteError) {
          console.error('Error deleting space expenses:', expensesDeleteError)
          return { success: false, error: 'Failed to delete expenses for this space.' }
        }

        // 2. Delete space row
        const { error: deleteError } = await supabase
          .from('spaces')
          .delete()
          .eq('id', id)
          .eq('user_id', currentUser.id)

        if (deleteError) {
          console.error('Error deleting space:', deleteError)
          return { success: false, error: deleteError.message }
        }

        // 3. Update spaces state
        const remaining = spaces.filter((s) => s.id !== id)
        setSpaces(remaining)

        // 4. If current space was the deleted one, switch to default space
        if (currentSpace?.id === id) {
          setCurrentSpace(defaultSpace)
        }

        return { success: true }
      } catch (err: any) {
        console.error('deleteSpace exception:', err)
        return { success: false, error: err?.message || 'Failed to delete space.' }
      }
    },
    [supabase, spaces, currentSpace, setCurrentSpace]
  )

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

        // Load profile, categories, tags, and spaces in parallel once
        const [profRes, catRes, tagRes, spaceRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
          supabase
            .from('categories')
            .select('*')
            .or(`user_id.eq.${currentUser.id},user_id.is.null`)
            .order('name'),
          supabase.from('tags').select('*').eq('user_id', currentUser.id).order('name'),
          supabase.from('spaces').select('*').eq('user_id', currentUser.id).order('created_at'),
        ])

        if (!mounted) return

        if (profRes.data) setProfile(profRes.data)
        if (catRes.data) setCategories(catRes.data)
        if (tagRes.data) setTags(tagRes.data)

        let loadedSpaces = spaceRes.data ?? []

        // If user has no spaces yet, auto-create default Space 1
        if (loadedSpaces.length === 0 && !spaceRes.error) {
          const defaultName =
            profRes.data?.display_name ||
            currentUser.user_metadata?.display_name ||
            currentUser.email?.split('@')[0] ||
            'Personal'

          const { data: newSpace } = await supabase
            .from('spaces')
            .insert({
              user_id: currentUser.id,
              name: defaultName,
              is_default: true,
              icon: 'layers',
              color: '#4F46E5',
            })
            .select()
            .single()

          if (newSpace) {
            loadedSpaces = [newSpace]

            // Assign any legacy expenses without space_id to this default space
            try {
              await supabase
                .from('expenses')
                .update({ space_id: newSpace.id })
                .eq('user_id', currentUser.id)
                .is('space_id', null)
            } catch (err) {
              console.warn('Expense backfill notice:', err)
            }
          }
        } else if (spaceRes.error) {
          // Fallback synthetic space if table is pending migration
          const fallbackName =
            profRes.data?.display_name ||
            currentUser.user_metadata?.display_name ||
            currentUser.email?.split('@')[0] ||
            'Personal'
          loadedSpaces = [
            {
              id: 'default-space',
              user_id: currentUser.id,
              name: fallbackName,
              icon: 'layers',
              color: '#4F46E5',
              is_default: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]
        }

        setSpaces(loadedSpaces)

        // Restore active space from localStorage
        let selected: Space | null = null
        if (typeof window !== 'undefined') {
          try {
            const savedId = localStorage.getItem(STORAGE_KEY)
            if (savedId === 'all') {
              selected = null
            } else if (savedId) {
              selected = loadedSpaces.find((s) => s.id === savedId) || null
            }
          } catch (e) {
            console.error('Failed reading localStorage:', e)
          }
        }

        // If no preference stored or invalid, pick default or first space
        if (selected === undefined || (selected === null && typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) !== 'all')) {
          selected = loadedSpaces.find((s) => s.is_default) || loadedSpaces[0] || null
        }

        setCurrentSpaceState(selected)
        setLoading(false)
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
  const isAllSpaces = currentSpace === null

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        categories,
        tags,
        spaces,
        currentSpace,
        isAllSpaces,
        currency,
        loading,
        setCurrentSpace,
        createSpace,
        updateSpace,
        deleteSpace,
        refreshCategories,
        refreshTags,
        refreshProfile,
        refreshSpaces,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
