'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useApp } from '@/components/providers/AppProvider'
import { CreateSpaceModal } from './CreateSpaceModal'
import {
  ChevronsUpDown,
  Plus,
  Check,
  Search,
  Layers,
  Home,
  Car,
  Briefcase,
  Building,
  ShoppingBag,
  Plane,
  Heart,
  Sparkles,
  Folder,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const ICON_MAP: Record<string, React.ElementType> = {
  layers: Layers,
  home: Home,
  car: Car,
  briefcase: Briefcase,
  building: Building,
  'shopping-bag': ShoppingBag,
  plane: Plane,
  heart: Heart,
  sparkles: Sparkles,
  folder: Folder,
}

export function SpaceSwitcher({ isMobile = false }: { isMobile?: boolean }) {
  const { spaces, currentSpace, isAllSpaces, setCurrentSpace } = useApp()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const filteredSpaces = useMemo(() => {
    if (!search.trim()) return spaces
    const q = search.toLowerCase()
    return spaces.filter((s) => s.name.toLowerCase().includes(q))
  }, [spaces, search])

  const activeTitle = isAllSpaces ? 'All Spaces' : currentSpace?.name || 'My Space'
  const activeInitial = isAllSpaces ? null : (activeTitle[0] || 'S').toUpperCase()
  const ActiveIcon = currentSpace?.icon ? ICON_MAP[currentSpace.icon] || Layers : Layers

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button (Supabase-like box with Apple styling) */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'flex items-center gap-2.5 rounded-xl text-left transition-all duration-200 select-none group py-1 px-1',
          'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
          open && 'bg-[var(--color-surface-hover)] border-[var(--color-border-hover)] ring-1 ring-[var(--color-border-hover)]',
        )}
      >
        {/* Square Avatar Badge */}
        <div
          className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs shadow-xs border transition-transform duration-200 group-hover:scale-105 border-[var(--color-border-secondary)]"
        >
          {isAllSpaces ? (
            <Layers className="w-4 h-4 text-[var(--color-accent)]" />
          ) : activeInitial ? (
            <span className="font-semibold text-xs">{activeInitial}</span>
          ) : (
            <ActiveIcon className="w-4 h-4" />
          )}
        </div>

        {/* Text column */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs flex items-center gap-2 font-semibold text-[var(--color-text-primary)] truncate tracking-tight leading-tight">
            {activeTitle} {/* Chevrons Up/Down Selector */}
            <ChevronsUpDown
              className={cn(
                'w-3.5 h-3.5 shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200 group-hover:text-[var(--color-text-secondary)]',
                open && 'rotate-180 text-[var(--color-text-primary)]'
              )}
            />
          </p>
          <div className="flex items-center gap-1 mt-0.5 text-[0.6875rem] text-[var(--color-text-tertiary)]">
            <span className="inline-block text-[0.625rem]">⬡</span>
            <span className="truncate">
              {isAllSpaces ? `${spaces.length} spaces` : currentSpace?.is_default ? 'Default space' : 'Space'}
            </span>
          </div>
        </div>
      </button>

      {/* Popover Dropdown (Matches Supabase Reference UI in Image 3) */}
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-72 sm:w-80 rounded-xl shadow-2xl border border-[var(--color-border-primary)]',
            'bg-[var(--color-bg-primary)] backdrop-blur-2xl p-2.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150',
            isMobile ? 'left-0 top-full' : 'left-0 top-full'
          )}
          style={{
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3), 0 0 0 1px var(--color-border-primary)',
          }}
          role="menu"
        >
          {/* Action Row: [All Spaces] & [+ New space] */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {/* <button
              type="button"
              onClick={() => {
                setCurrentSpace(null)
                setOpen(false)
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all duration-150 border',
                isAllSpaces
                  ? 'border-[var(--color-border-hover)] bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] shadow-2xs font-semibold'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
              )}
            >
              <span>All Spaces</span>
              <span className="text-[0.6875rem] px-1.5 py-0.2 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-primary)]">
                {spaces.length}
              </span>
            </button> */}


          </div>

          {/* Search Filter Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search space"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]/50 text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setCreateModalOpen(true)
            }}
            className="flex items-center justify-center gap-1 py-2 px-3.5 rounded-md text-xs font-medium border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] transition-all duration-150 active:scale-95 shadow-2xs w-full"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New space</span>
          </button>

          {/* Spaces List */}
          <div className="max-h-56 overflow-y-auto space-y-1 py-0.5 custom-scrollbar">
            {filteredSpaces.length === 0 ? (
              <div className="py-4 text-center text-xs text-[var(--color-text-tertiary)]">
                No spaces found.
              </div>
            ) : (
              filteredSpaces.map((space) => {
                const isActive = !isAllSpaces && currentSpace?.id === space.id
                const initial = (space.name[0] || 'S').toUpperCase()
                const SpaceIconComponent = space.icon ? ICON_MAP[space.icon] || Layers : Layers

                return (
                  <button
                    key={space.id}
                    type="button"
                    onClick={() => {
                      setCurrentSpace(space)
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-150 group',
                      isActive
                        ? 'bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-medium shadow-2xs'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]/70'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar Icon */}
                      <div
                        className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs border"
                        style={{
                          backgroundColor: space.color ? `${space.color}15` : 'var(--color-surface-primary)',
                          borderColor: space.color ? `${space.color}40` : 'var(--color-border-primary)',
                          color: space.color || 'var(--color-text-primary)',
                        }}
                      >
                        {initial}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs truncate tracking-tight font-medium text-[var(--color-text-primary)]">
                          {space.name}
                        </p>
                        {space.is_default && (
                          <p className="text-[0.625rem] text-[var(--color-text-tertiary)]">
                            Personal space
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Active Checkmark Icon */}
                    {isActive && (
                      <Check className="w-4 h-4 text-[var(--color-text-primary)] shrink-0 ml-2" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Create Space Dialog */}
      <CreateSpaceModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  )
}
