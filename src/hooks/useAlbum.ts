import { useState, useCallback, useMemo } from 'react'
import { totalStickers, defaultCollected } from '../data/album'

const COLLECTED_KEY = 'barajitas-collected'
const REPEATED_KEY = 'barajitas-repeated'
const SEEDED_KEY = 'barajitas-seeded-v1'

function seedVersion(): string {
  const ids = [...defaultCollected].sort()
  const hash = ids.join('|').split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) >>> 0
  }, 0)
  return `${ids.length}-${hash.toString(36)}`
}

function parseCollected(raw: string | null): Set<string> {
  if (!raw) return new Set()
  const parsed: unknown = JSON.parse(raw)
  const ids = Array.isArray(parsed) ? (parsed as unknown[]).filter((x): x is string => typeof x === 'string') : []
  return new Set(ids)
}

function loadCollected(): Set<string> {
  try {
    const currentSeedVersion = seedVersion()
    const collected = parseCollected(localStorage.getItem(COLLECTED_KEY))

    if (localStorage.getItem(SEEDED_KEY) !== currentSeedVersion) {
      // Merge new photo/control-sheet evidence without discarding user-added stickers.
      const seeded = new Set([...collected, ...defaultCollected])
      saveCollected(seeded)
      localStorage.setItem(SEEDED_KEY, currentSeedVersion)
      return seeded
    }

    return collected
  } catch {
    return new Set()
  }
}

function saveCollected(set: Set<string>) {
  localStorage.setItem(COLLECTED_KEY, JSON.stringify([...set]))
}

function loadRepeated(): Record<string, number> {
  try {
    const raw = localStorage.getItem(REPEATED_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function saveRepeated(rec: Record<string, number>) {
  localStorage.setItem(REPEATED_KEY, JSON.stringify(rec))
}

export function useAlbum() {
  const [collected, setCollected] = useState<Set<string>>(loadCollected)
  const [repeated, setRepeated] = useState<Record<string, number>>(loadRepeated)

  const toggle = useCallback((id: string) => {
    setCollected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveCollected(next)
      return next
    })
  }, [])

  const incrementRepeated = useCallback((id: string) => {
    setCollected((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      saveCollected(next)
      return next
    })
    setRepeated((prev) => {
      const next = { ...prev, [id]: (prev[id] ?? 0) + 1 }
      saveRepeated(next)
      return next
    })
  }, [])

  const decrementRepeated = useCallback((id: string) => {
    setRepeated((prev) => {
      const current = prev[id] ?? 0
      if (current === 0) return prev
      const next = { ...prev, [id]: current - 1 }
      if (next[id] === 0) delete next[id]
      saveRepeated(next)
      return next
    })
  }, [])

  const progress = useMemo(
    () => ({ collected: collected.size, total: totalStickers }),
    [collected.size],
  )

  const repeatedCount = useMemo(
    () => Object.values(repeated).reduce((sum, n) => sum + n, 0),
    [repeated],
  )

  return { collected, toggle, progress, repeated, incrementRepeated, decrementRepeated, repeatedCount }
}
