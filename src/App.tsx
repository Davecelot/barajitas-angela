import { useMemo, useRef, useState } from 'react'
import { teams, specialStickers } from './data/album'
import { useAlbum } from './hooks/useAlbum'
import { SearchBar } from './components/SearchBar'
import { TeamSection } from './components/TeamSection'
import { StickerCard } from './components/StickerCard'
import { AuthButton } from './components/AuthButton'
import { formatMissing, formatRepeated } from './utils/share'
import { useAuth } from './hooks/useAuth'

type Tab = 'todas' | 'repetidas'

export default function App() {
  const { user, canEdit, login, logout } = useAuth()
  const {
    collected,
    toggle,
    progress,
    repeated,
    incrementRepeated,
    decrementRepeated,
    repeatedCount,
  } = useAlbum()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('todas')
  const [toast, setToast] = useState<string | null>(null)
  const toastTimeout = useRef<number | null>(null)

  const pct = Math.round((progress.collected / progress.total) * 100)
  const hasMissing = progress.collected < progress.total
  const hasRepeated = repeatedCount > 0

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const isRepeated = (id: string) => tab === 'todas' || (repeated[id] ?? 0) > 0
    const matchesQuery = (name: string, number: number, teamName = '') =>
      !q || name.toLowerCase().includes(q) || String(number).includes(q) || teamName.toLowerCase().includes(q)

    return {
      specials: specialStickers.filter(
        (s) => isRepeated(s.id) && matchesQuery(s.name, s.number),
      ),
      teams: teams
        .map((t) => ({
          ...t,
          stickers: t.stickers.filter(
            (s) => isRepeated(s.id) && matchesQuery(s.name, s.number, t.name),
          ),
        }))
        .filter((t) => t.stickers.length > 0),
    }
  }, [query, tab, repeated])

  const showFullAlbum = tab === 'todas' && !query.trim()

  const copyText = async (text: string, label = '¡Copiado!') => {
    try {
      await navigator.clipboard.writeText(text)
      setToast(label)
    } catch {
      setToast('No se pudo copiar')
    }
    if (toastTimeout.current !== null) {
      window.clearTimeout(toastTimeout.current)
    }
    toastTimeout.current = window.setTimeout(() => setToast(null), 2000)
  }

  const teamProps = {
    collected,
    onToggle: toggle,
    onCopyMissing: (team: (typeof teams)[number]) => copyText(formatMissing([team], collected)),
    repeated,
    onIncrement: incrementRepeated,
    onDecrement: decrementRepeated,
    canEdit,
  }

  const cardProps = (id: string) => ({
    collected: collected.has(id),
    onToggle: toggle,
    repeated: repeated[id] ?? 0,
    onIncrement: incrementRepeated,
    onDecrement: decrementRepeated,
    canEdit,
  })

  return (
    <div className="album-shell">
      <header className="sticky top-0 z-10 border-b-2 border-[var(--album-line)] bg-white">
        <div className="album-container py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase leading-snug tracking-[0.08em] text-[var(--album-blue)]">FIFA World Cup 2026</p>
              <div className="mt-1 flex items-center justify-between gap-2 py-0.5 md:justify-start">
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-2xl font-black leading-tight text-[var(--album-green)] md:text-4xl">
                    Barajitas Angela
                  </h1>
                  <span className="hidden rounded-full bg-[var(--album-yellow)] px-2 py-1 text-xs font-black leading-snug text-[var(--album-ink)] min-[360px]:inline">
                    Album
                  </span>
                </div>
                <div className="md:hidden">
                  <AuthButton user={user} canEdit={canEdit} onLogin={login} onLogout={logout} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <AuthButton user={user} canEdit={canEdit} onLogin={login} onLogout={logout} />
              </div>
              <div className="grid flex-1 grid-cols-[1fr_auto] items-center gap-3 rounded-[var(--album-radius)] border-2 border-[var(--album-line)] bg-[var(--album-surface)] px-3 py-2 md:min-w-72">
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs font-black uppercase leading-snug tracking-[0.08em] text-[var(--album-muted)]">Progreso</span>
                    <span className="text-sm font-black leading-snug text-[var(--album-ink)]">{pct}%</span>
                  </div>
                  <div className="album-progress mt-2 h-2.5">
                    <div
                      className="album-progress__bar"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-[var(--album-control-radius)] bg-[var(--album-green-soft)] px-3 py-2 text-center text-sm font-black leading-snug text-[var(--album-green-dark)]">
                  {progress.collected}<span className="text-[var(--album-muted)]">/{progress.total}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:flex md:items-center">
            <button
              type="button"
              onClick={() => setTab('todas')}
              data-active={tab === 'todas'}
              className="album-tab px-4 py-2 text-sm md:w-36"
            >
              Mi album
            </button>
            <button
              type="button"
              onClick={() => setTab('repetidas')}
              data-active={tab === 'repetidas'}
              className="album-tab flex items-center justify-center gap-2 px-4 py-2 text-sm md:w-44"
            >
              Para cambiar
              {repeatedCount > 0 && (
                <span className="album-badge bg-[var(--album-yellow)] text-[var(--album-ink)]">
                  {repeatedCount}
                </span>
              )}
            </button>
          </div>

          {(tab === 'todas' && hasMissing) || (tab === 'repetidas' && hasRepeated) ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {tab === 'todas' && hasMissing && (
                <button
                  type="button"
                  onClick={() => copyText(formatMissing(teams, collected), '¡Faltantes copiados!')}
                  className="album-button-primary px-4 py-2 text-sm"
                >
                  Copiar faltantes
                </button>
              )}
              {tab === 'repetidas' && hasRepeated && (
                <button
                  type="button"
                  onClick={() => copyText(formatRepeated(teams, specialStickers, repeated), '¡Repetidas copiadas!')}
                  className="album-button-primary px-4 py-2 text-sm"
                >
                  Copiar repetidas
                </button>
              )}
            </div>
          ) : null}

          <div className="mt-2">
            <SearchBar value={query} onChange={setQuery} />
          </div>
        </div>
        {toast && (
          <div className="absolute right-4 top-3 rounded-[var(--album-control-radius)] bg-[var(--album-yellow)] px-3 py-2 text-xs font-black text-[var(--album-ink)] shadow-[0_3px_0_#d29b00]">
            {toast}
          </div>
        )}
      </header>

      <main className="album-container flex flex-col gap-3 pb-8 pt-4">
        {tab === 'repetidas' && repeatedCount === 0 && !query.trim() ? (
          <div className="album-panel mt-4 p-6 text-center">
            <p className="text-lg font-black text-[var(--album-ink)]">Todavía no hay barajitas para cambiar.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-[var(--album-muted)]">
              Marca copias extra desde Mi album y aparecerán acá.
            </p>
            <button
              type="button"
              onClick={() => setTab('todas')}
              className="album-button-primary mx-auto mt-4 px-5 py-2 text-sm"
            >
              Ir a Mi album
            </button>
          </div>
        ) : showFullAlbum ? (
          <>
            <div className="album-panel">
              <div className="border-b-2 border-[var(--album-line)] px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[var(--album-ink)]">Stickers especiales</span>
                  <span className="album-badge bg-[var(--album-green-soft)] text-[var(--album-green-dark)]">
                    {specialStickers.filter((s) => collected.has(s.id)).length}/{specialStickers.length}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-3 py-3">
                {specialStickers.map((s) => (
                  <StickerCard key={s.id} sticker={s} {...cardProps(s.id)} />
                ))}
              </div>
            </div>

            <h2 className="album-section-label px-1 pt-2">Equipos</h2>
            {teams.map((t) => (
              <TeamSection key={t.id} team={t} {...teamProps} />
            ))}
          </>
        ) : (
          <>
            {filtered.specials.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="album-section-label px-1">Especiales</h2>
                {filtered.specials.map((s) => (
                  <StickerCard key={s.id} sticker={s} {...cardProps(s.id)} />
                ))}
              </div>
            )}
            {filtered.teams.map((t) => (
              <TeamSection key={t.id} team={t} {...teamProps} forceOpen />
            ))}
            {filtered.specials.length === 0 && filtered.teams.length === 0 && (
              <div className="album-panel mt-4 p-6 text-center">
                <p className="text-base font-black text-[var(--album-ink)]">
                  {query.trim()
                    ? `Sin resultados para "${query}"`
                    : 'No hay barajitas para cambiar con ese nombre.'}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--album-muted)]">
                  Prueba con el número, nombre de jugador o selección.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
