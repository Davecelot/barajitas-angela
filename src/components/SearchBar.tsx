type Props = {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-[var(--album-silver)]">
        Buscar
      </span>
      <input
        type="search"
        placeholder="sticker, jugador o selección"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-[var(--album-control-radius)] border-2 border-[var(--album-line)] bg-white py-2.5 pl-[4.35rem] pr-4 text-sm font-semibold text-[var(--album-ink)] outline-none placeholder:text-[var(--album-silver)] focus:border-[var(--album-blue)]"
      />
    </div>
  )
}
