'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useToast } from '@/components/ui/Toaster'

interface PwaContextType {
  isInstallable: boolean
  promptInstall: () => Promise<void>
  isOnline: boolean
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  promptInstall: async () => {},
  isOnline: true,
})

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const { info, warning } = useToast()

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Spendly Service Worker registered:', reg.scope)
          })
          .catch((err) => {
            console.error('Service Worker registration failed:', err)
          })
      })
    }

    // Capture install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Online/offline tracking
    const handleOnline = () => {
      setIsOnline(true)
      info('Back online. Synchronized with database.')
    }

    const handleOffline = () => {
      setIsOnline(false)
      warning('You are currently offline. Changes cannot be synchronized.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [info, warning])

  async function promptInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
  }

  return (
    <PwaContext.Provider value={{ isInstallable, promptInstall, isOnline }}>
      {children}
    </PwaContext.Provider>
  )
}

export function usePwa() {
  return useContext(PwaContext)
}
