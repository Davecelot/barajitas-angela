import { useCallback, useEffect, useMemo, useState } from 'react'
import { AUTH_CLEARED_EVENT, apiFetch, clearAuth, getStoredUser, setStoredUser, setToken } from '../lib/api'

type Role = 'admin' | 'normal'

type SessionUser = {
  id: string
  name: string
  role: Role
}

interface LoginResponse {
  token: string
  user: SessionUser
}

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(() => getStoredUser<SessionUser>())

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await apiFetch<LoginResponse>('/api/login', {
        method: 'POST',
        auth: false,
        body: { username, password },
      })
      setToken(res.token)
      setStoredUser(res.user)
      setUser(res.user)
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
  }, [])

  useEffect(() => {
    const onCleared = () => setUser(null)
    window.addEventListener(AUTH_CLEARED_EVENT, onCleared)
    return () => window.removeEventListener(AUTH_CLEARED_EVENT, onCleared)
  }, [])

  const canEdit = user?.role === 'admin'

  return useMemo(() => ({ user, canEdit, login, logout }), [canEdit, login, logout, user])
}
