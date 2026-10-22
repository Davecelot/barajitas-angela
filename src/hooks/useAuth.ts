import { useEffect, useState, useSyncExternalStore } from 'react'
import { createAuthClient } from '../utils/auth'

export function useAuth() {
  const [client] = useState(() => createAuthClient({
    apiUrl: import.meta.env.VITE_API_URL,
    storage: {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key),
    },
  }))
  const user = useSyncExternalStore(client.subscribe, client.getSnapshot, () => null)
  useEffect(() => {
    const syncAuth = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage) void client.handleStorageChange(event.key)
    }
    window.addEventListener('storage', syncAuth)
    void client.restore()
    return () => {
      window.removeEventListener('storage', syncAuth)
      client.cancelPending()
    }
  }, [client])
  const canEdit = user?.role === 'admin'
  return { user, canEdit, login: client.login, logout: client.logout, loginAvailable: client.configured }
}
