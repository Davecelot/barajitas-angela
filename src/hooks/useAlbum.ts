import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { totalStickers } from '../data/album'
import { ApiError, apiFetch } from '../lib/api'

type Repeated = Record<string, number>

interface AlbumResponse {
  collected: string[]
  repeated: Repeated
  updatedAt: number
  updatedBy: string | null
}

interface UseAlbumOptions {
  canEdit: boolean
}

type SyncStatus = 'idle' | 'loading' | 'saving' | 'error' | 'offline'

const REFETCH_ON_FOCUS_MIN_INTERVAL_MS = 5_000

export function useAlbum({ canEdit }: UseAlbumOptions) {
  const [collected, setCollected] = useState<Set<string>>(new Set())
  const [repeated, setRepeated] = useState<Repeated>({})
  const [status, setStatus] = useState<SyncStatus>('loading')
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const lastRefetchRef = useRef(0)
  const saveSeqRef = useRef(0)
  // Refs mirror the latest state so callbacks can read sibling state without
  // closing over stale snapshots from a previous render.
  const collectedRef = useRef(collected)
  const repeatedRef = useRef(repeated)
  collectedRef.current = collected
  repeatedRef.current = repeated

  const applyServerState = useCallback((data: AlbumResponse) => {
    setCollected(new Set(data.collected))
    setRepeated(data.repeated ?? {})
    setUpdatedAt(data.updatedAt)
  }, [])

  const refetch = useCallback(async () => {
    setStatus((s) => (s === 'idle' || s === 'offline' ? 'loading' : s))
    try {
      const data = await apiFetch<AlbumResponse>('/api/album', { method: 'GET' })
      applyServerState(data)
      lastRefetchRef.current = Date.now()
      setStatus('idle')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setStatus('idle')
        return
      }
      setStatus('offline')
    }
  }, [applyServerState])

  useEffect(() => {
    void refetch()
  }, [refetch])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastRefetchRef.current < REFETCH_ON_FOCUS_MIN_INTERVAL_MS) return
      void refetch()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onVisibility)
    }
  }, [refetch])

  const persist = useCallback(
    async (nextCollected: Set<string>, nextRepeated: Repeated) => {
      if (!canEdit) return
      const seq = ++saveSeqRef.current
      setStatus('saving')
      try {
        const res = await apiFetch<{ ok: true; updatedAt: number }>('/api/album', {
          method: 'PUT',
          body: { collected: [...nextCollected], repeated: nextRepeated },
        })
        if (seq !== saveSeqRef.current) return
        setUpdatedAt(res.updatedAt)
        setStatus('idle')
      } catch {
        if (seq !== saveSeqRef.current) return
        setStatus('error')
        // Reconcile with server truth on failure.
        void refetch()
      }
    },
    [canEdit, refetch],
  )

  const toggle = useCallback(
    (id: string) => {
      if (!canEdit) return
      const prev = collectedRef.current
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      collectedRef.current = next
      setCollected(next)
      void persist(next, repeatedRef.current)
    },
    [canEdit, persist],
  )

  const incrementRepeated = useCallback(
    (id: string) => {
      if (!canEdit) return
      const prevCollected = collectedRef.current
      const nextCollected = prevCollected.has(id) ? prevCollected : new Set(prevCollected).add(id)
      const prevRepeated = repeatedRef.current
      const nextRepeated = { ...prevRepeated, [id]: (prevRepeated[id] ?? 0) + 1 }
      collectedRef.current = nextCollected
      repeatedRef.current = nextRepeated
      if (nextCollected !== prevCollected) setCollected(nextCollected)
      setRepeated(nextRepeated)
      void persist(nextCollected, nextRepeated)
    },
    [canEdit, persist],
  )

  const decrementRepeated = useCallback(
    (id: string) => {
      if (!canEdit) return
      const prev = repeatedRef.current
      const current = prev[id] ?? 0
      if (current === 0) return
      const next = { ...prev, [id]: current - 1 }
      if (next[id] === 0) delete next[id]
      repeatedRef.current = next
      setRepeated(next)
      void persist(collectedRef.current, next)
    },
    [canEdit, persist],
  )

  const progress = useMemo(
    () => ({ collected: collected.size, total: totalStickers }),
    [collected.size],
  )

  const repeatedCount = useMemo(
    () => Object.values(repeated).reduce((sum, n) => sum + n, 0),
    [repeated],
  )

  return {
    collected,
    toggle,
    progress,
    repeated,
    incrementRepeated,
    decrementRepeated,
    repeatedCount,
    status,
    updatedAt,
    refetch,
  }
}
