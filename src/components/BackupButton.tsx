import { useEffect, useRef, useState } from 'react'

type BackupPayload = {
  collected: string[]
  repeated: Record<string, number>
}

type Props = {
  collected: Set<string>
  repeated: Record<string, number>
  onImport: (data: BackupPayload) => void
  canEdit: boolean
  onError?: (message: string) => void
  onSuccess?: (message: string) => void
}

function parsePayload(raw: string): BackupPayload {
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object') throw new Error('Archivo inválido')
  const obj = parsed as Record<string, unknown>
  const collectedRaw = obj.collected
  const repeatedRaw = obj.repeated
  if (!Array.isArray(collectedRaw) || typeof repeatedRaw !== 'object' || repeatedRaw === null) {
    throw new Error('Formato inválido')
  }
  const collected = collectedRaw.filter((id): id is string => typeof id === 'string')
  const repeated: Record<string, number> = {}
  for (const [id, count] of Object.entries(repeatedRaw as Record<string, unknown>)) {
    if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
      repeated[id] = Math.floor(count)
    }
  }
  return { collected, repeated }
}

export function BackupButton({ collected, repeated, onImport, canEdit, onError, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const exportNow = () => {
    const payload: BackupPayload = { collected: [...collected], repeated }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const stamp = new Date().toISOString().slice(0, 10)
    const link = document.createElement('a')
    link.href = url
    link.download = `barajitas-angela-${stamp}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setOpen(false)
    onSuccess?.('Backup descargado')
  }

  const triggerImport = () => {
    setOpen(false)
    fileInputRef.current?.click()
  }

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const data = parsePayload(text)
      const confirmed = window.confirm(
        '¿Reemplazar el álbum actual con el backup? Esta acción no se puede deshacer.',
      )
      if (!confirmed) return
      onImport(data)
      onSuccess?.('Backup restaurado')
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'No se pudo importar')
    }
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="album-button-secondary px-3 text-sm"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Backup ▾
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-20 w-[min(82vw,220px)] overflow-hidden rounded-[var(--album-radius)] border-2 border-[var(--album-line)] bg-white shadow-[0_8px_0_rgba(60,60,60,0.12)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={exportNow}
            className="block w-full px-4 py-3 text-left text-sm font-black text-[var(--album-ink)] hover:bg-[var(--album-surface)]"
          >
            Exportar JSON
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={triggerImport}
            disabled={!canEdit}
            className="block w-full border-t-2 border-[var(--album-line)] px-4 py-3 text-left text-sm font-black text-[var(--album-ink)] hover:bg-[var(--album-surface)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Importar JSON
          </button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
