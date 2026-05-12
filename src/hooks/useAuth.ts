import { useCallback, useMemo, useState } from 'react'
import users from '../data/users.json'

type Role = 'admin' | 'normal'

type User = {
  id: string
  name: string
  username: string
  password: string
  role: Role
}

type SessionUser = Pick<User, 'id' | 'name' | 'role'>

const AUTH_KEY = 'barajitas-auth-user'
const staticUsers = users as User[]

function loadSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SessionUser>
    const user = staticUsers.find((candidate) => candidate.id === parsed.id)
    return user ? { id: user.id, name: user.name, role: user.role } : null
  } catch {
    return null
  }
}

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(loadSession)

  const login = useCallback((username: string, password: string) => {
    const normalizedUsername = username.trim().toLowerCase()
    const match = staticUsers.find(
      (candidate) => candidate.username.toLowerCase() === normalizedUsername && candidate.password === password,
    )

    if (!match) return false

    const sessionUser = { id: match.id, name: match.name, role: match.role }
    localStorage.setItem(AUTH_KEY, JSON.stringify(sessionUser))
    setUser(sessionUser)
    return true
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
  }, [])

  const canEdit = user?.role === 'admin'

  return useMemo(() => ({ user, canEdit, login, logout }), [canEdit, login, logout, user])
}
