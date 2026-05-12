import type { Sticker } from '../data/album'

type Props = {
  sticker: Sticker
  collected: boolean
  onToggle: (id: string) => void
  repeated: number
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  canEdit: boolean
}

export function StickerCard({ sticker, collected, onToggle, repeated, onIncrement, onDecrement, canEdit }: Props) {
  const stateClass = sticker.isShiny && collected
    ? 'border-[var(--album-gold)] bg-[#fff8db] text-[var(--album-ink)]'
    : sticker.isShiny
      ? 'border-[#c9c9c9] bg-[#f3f5f7] text-[var(--album-charcoal)]'
      : collected
        ? 'border-[var(--album-green)] bg-[var(--album-green-soft)] text-[var(--album-green-dark)]'
        : 'border-[var(--album-line)] bg-[#f7f7f7] text-[var(--album-muted)]'

  return (
    <div
      className={[
        'flex w-full items-center gap-2 rounded-[var(--album-radius)] border-2 px-2.5 py-2 transition-colors sm:px-3',
        stateClass,
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => onToggle(sticker.id)}
        disabled={!canEdit}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--album-radius)] text-left outline-none active:scale-[0.99] disabled:cursor-default focus-visible:ring-2 focus-visible:ring-[var(--album-blue)]"
      >
        <span className="w-9 shrink-0 rounded-md bg-white/70 px-1.5 py-1 text-center text-xs font-black tabular-nums">
          #{sticker.number}
        </span>
        <span className={['flex-1 truncate text-sm', sticker.isShiny ? 'font-black' : 'font-bold'].join(' ')}>
          {sticker.name}
        </span>
        <span className={[
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--album-control-radius)] border-2 text-xs font-black',
          collected ? 'border-[var(--album-green)] bg-white text-[var(--album-green-dark)]' : 'border-[var(--album-line)] bg-white text-[var(--album-silver)]',
        ].join(' ')}>
          {collected ? '✓' : ''}
        </span>
      </button>

      <div
        className="flex shrink-0 items-center gap-1"
        aria-label={`Copias extra de ${sticker.name}: ${repeated}`}
      >
        {repeated > 0 && (
          <span className="album-badge min-w-8 gap-1 bg-[var(--album-yellow)] text-[var(--album-ink)]">
            <span className="hidden text-[10px] uppercase sm:inline">Extra</span>
            <span>+{repeated}</span>
          </span>
        )}
        {canEdit && (
          <>
            <button
              type="button"
              onClick={() => onDecrement(sticker.id)}
              disabled={repeated === 0}
              aria-label={`Quitar repetida de ${sticker.name}`}
              title="Quitar copia extra"
              className="flex h-8 w-8 items-center justify-center rounded-[var(--album-control-radius)] border-2 border-[var(--album-line)] bg-white text-base font-black text-[var(--album-muted)] outline-none transition disabled:opacity-35 active:translate-y-px focus-visible:ring-2 focus-visible:ring-[var(--album-blue)]"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => onIncrement(sticker.id)}
              aria-label={`Agregar repetida de ${sticker.name}`}
              title="Agregar copia extra"
              className="flex h-8 w-8 items-center justify-center rounded-[var(--album-control-radius)] bg-[var(--album-yellow)] text-base font-black text-[var(--album-ink)] shadow-[0_3px_0_#d29b00] outline-none transition active:translate-y-[2px] active:shadow-[0_1px_0_#d29b00] focus-visible:ring-2 focus-visible:ring-[var(--album-blue)]"
            >
              +
            </button>
          </>
        )}
      </div>
    </div>
  )
}
