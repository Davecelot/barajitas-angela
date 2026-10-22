export type SessionUser = { id: string; name: string; role: 'admin' | 'normal' }

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>
type Options = { apiUrl?: string; storage: Storage; fetcher?: typeof fetch }
type SavedState = { record: string | null; revision: string | null }

export const TOKEN_KEY = 'barajitas-auth-token'
export const LOGOUT_KEY = 'barajitas-auth-logout-revision'
const LEGACY_KEY = 'barajitas-auth-user'

function trustedApi(apiUrl?: string): URL | null {
  if (!apiUrl) return null
  try {
    const url = new URL(apiUrl)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null
    url.pathname = url.pathname.replace(/\/$/, '') + '/'
    return url
  } catch { return null }
}

function sessionUser(payload: unknown): SessionUser | null {
  if (!payload || typeof payload !== 'object' || !('user' in payload)) return null
  const user = payload.user
  if (!user || typeof user !== 'object') return null
  if (!('id' in user) || typeof user.id !== 'string' || !user.id) return null
  if (!('name' in user) || typeof user.name !== 'string' || !user.name) return null
  if (!('role' in user) || (user.role !== 'admin' && user.role !== 'normal')) return null
  return { id: user.id, name: user.name, role: user.role }
}

function boundToken({ record, revision }: SavedState): string | null {
  if (!record || record.length > 10000) return null
  // Accept an initial plain token only before any logout revision exists.
  if (!record.startsWith('{')) return revision === null ? record : null
  try {
    const value = JSON.parse(record)
    return value && typeof value.token === 'string' && value.revision === revision ? value.token : null
  } catch { return null }
}

export function createAuthClient({ apiUrl, storage, fetcher = fetch }: Options) {
  const api = trustedApi(apiUrl)
  const listeners = new Set<() => void>()
  const read = (key: string) => {
    try { return storage.getItem(key) } catch { return null }
  }
  const savedState = (): SavedState => ({ record: read(TOKEN_KEY), revision: read(LOGOUT_KEY) })
  const same = (a: SavedState, b: SavedState) => a.record === b.record && a.revision === b.revision
  let observed = savedState()
  let authenticated: SavedState | null = null
  let user: SessionUser | null = null
  let generation = 0

  const publish = (next: SessionUser | null, state: SavedState | null = null) => {
    user = next
    authenticated = next ? state : null
    for (const listener of listeners) listener()
  }
  const clearToken = () => {
    try { storage.removeItem(TOKEN_KEY) } catch { /* Fail closed in memory. */ }
  }
  const validateToken = async (token: string): Promise<SessionUser | null> => {
    if (!api || !token || token.length > 8192 || /\s/.test(token)) return null
    const response = await fetcher(new URL('api/me', api), {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'omit', redirect: 'error', cache: 'no-store',
    })
    return response.ok ? sessionUser(await response.json()) : null
  }

  const client = {
    configured: api !== null,
    getSnapshot: () => user && authenticated && same(authenticated, savedState()) ? user : null,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    cancelPending() { generation++ },
    async handleStorageChange(key: string | null) {
      if (key !== null && key !== TOKEN_KEY && key !== LEGACY_KEY && key !== LOGOUT_KEY) return
      // Ignore delayed events already incorporated by a newer operation.
      if (same(observed, savedState())) return
      generation++
      publish(null)
      await client.restore()
    },
    async restore() {
      const current = ++generation
      try { storage.removeItem(LEGACY_KEY) } catch { /* Never trust legacy identity. */ }
      const state = savedState()
      observed = state
      const token = boundToken(state)
      let next: SessionUser | null = null
      try { if (token) next = await validateToken(token) } catch { /* Fail closed. */ }
      if (current !== generation) return
      if (!same(state, savedState())) { publish(null); return }
      if (!next) {
        clearToken()
        observed = savedState()
      }
      publish(next, next ? state : null)
    },
    async login(username: string, password: string): Promise<boolean> {
      const current = ++generation
      const revision = read(LOGOUT_KEY)
      clearToken()
      observed = savedState()
      publish(null)
      if (!api) return false
      try {
        const response = await fetcher(new URL('api/login', api), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          credentials: 'omit', redirect: 'error', cache: 'no-store',
          body: JSON.stringify({ username: username.trim(), password }),
        })
        if (!response.ok) return false
        const payload: unknown = await response.json()
        if (!payload || typeof payload !== 'object' || !('token' in payload) || typeof payload.token !== 'string') return false
        const next = await validateToken(payload.token)
        if (!next || current !== generation || revision !== read(LOGOUT_KEY)) return false
        // A persisted token carries its own fence, closing the read/write gap.
        const record = JSON.stringify({ token: payload.token, revision })
        storage.setItem(TOKEN_KEY, record)
        const state = { record, revision }
        if (!same(state, savedState())) {
          if (read(TOKEN_KEY) === record) clearToken()
          observed = savedState()
          publish(null)
          return false
        }
        observed = state
        publish(next, state)
        return true
      } catch { return false }
    },
    logout() {
      generation++
      clearToken()
      try { storage.setItem(LOGOUT_KEY, crypto.randomUUID()) } catch { /* Local logout still fails closed. */ }
      observed = savedState()
      publish(null)
    },
  }
  return client
}
