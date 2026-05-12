import { useState } from 'react'
import type { Team } from '../data/album'
import { StickerCard } from './StickerCard'

type Props = {
  team: Team
  collected: Set<string>
  onToggle: (id: string) => void
  onCopyMissing: (team: Team) => void
  forceOpen?: boolean
  repeated: Record<string, number>
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  canEdit: boolean
}

export function TeamSection({ team, collected, onToggle, onCopyMissing, forceOpen, repeated, onIncrement, onDecrement, canEdit }: Props) {
  const [open, setOpen] = useState(false)

  const teamCollected = team.stickers.filter((s) => collected.has(s.id)).length
  const total = team.stickers.length
  const complete = teamCollected === total
  const pct = Math.round((teamCollected / total) * 100)

  const isOpen = forceOpen || open

  return (
    <section className="album-panel">
      <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--album-radius)] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--album-blue)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--album-control-radius)] bg-[var(--album-green-soft)] text-2xl">
            {team.flag}
          </span>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-black text-[var(--album-ink)] sm:text-base">{team.name}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[0.08em] text-[var(--album-muted)]">Grupo {team.group}</span>
              <div className="album-progress h-2 min-w-16 flex-1">
                <div
                  className="album-progress__bar"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
          <div className={['album-badge', complete ? 'bg-[var(--album-green-soft)] text-[var(--album-green-dark)]' : 'bg-[#f3f3f3] text-[var(--album-muted)]'].join(' ')}>
            {teamCollected}/{total}
          </div>
          <span className="text-sm font-black text-[var(--album-silver)]">{isOpen ? '−' : '+'}</span>
        </button>
        {!complete && (
          <button
            type="button"
            aria-label={`Copiar faltantes de ${team.name}`}
            title="Copiar faltantes del equipo"
            onClick={() => onCopyMissing(team)}
            className="album-icon-button shrink-0 gap-1 px-2 text-sm"
          >
            <span aria-hidden="true" className="text-lg leading-none">⧉</span>
            <span className="hidden font-black sm:inline">Faltantes</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="flex flex-col gap-2 border-t-2 border-[var(--album-line)] px-3 py-3">
          {team.stickers.map((sticker) => (
            <StickerCard
              key={sticker.id}
              sticker={sticker}
              collected={collected.has(sticker.id)}
              onToggle={onToggle}
              repeated={repeated[sticker.id] ?? 0}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </section>
  )
}
