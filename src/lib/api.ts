function normalizeBase(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return undefined
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(
      `VITE_API_URL must include protocol (https://). Got: "${raw}"`,
    )
  }
  return trimmed
}

const BASE = normalizeBase(import.meta.env.VITE_API_URL as string | undefined)

const TOKEN_KEY = 'barajitas-token'
const USER_KEY = 'barajitas-user'

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message?: string) {
    super(message ?? code)
    this.status = status
    this.code = code
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export const AUTH_CLEARED_EVENT = 'barajitas:auth-cleared'

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_CLEARED_EVENT))
  }
}

export function getStoredUser<T>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function setStoredUser<T>(user: T) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function assertBase(): string {
  if (!BASE) {
    throw new ApiError(0, 'config_missing', 'VITE_API_URL is not configured')
  }
  return BASE
}

interface ApiInit extends Omit<RequestInit, 'body'> {
  body?: unknown
  auth?: boolean
}

export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<T> {
  const base = assertBase()
  const headers = new Headers(init.headers)
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')
  if (init.auth !== false) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  let res: Response
  try {
    res = await fetch(base + path, {
      ...init,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    throw new ApiError(0, 'network_error')
  }

  if (res.status === 401) {
    clearAuth()
    throw new ApiError(401, 'unauthorized')
  }
  if (!res.ok) {
    let code = 'http_error'
    try {
      const body = (await res.json()) as { error?: string }
      if (typeof body.error === 'string') code = body.error
    } catch {
      // ignore parse failure
    }
    throw new ApiError(res.status, code)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
