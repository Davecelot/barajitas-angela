import { useId, useState, type FormEvent } from 'react'

type AuthUser = {
  name: string
  role: 'admin' | 'normal'
}

type Props = {
  user: AuthUser | null
  canEdit: boolean
  onLogin: (username: string, password: string) => boolean
  onLogout: () => void
}

export function AuthButton({ user, canEdit, onLogin, onLogout }: Props) {
  const usernameId = useId()
  const passwordId = useId()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (onLogin(username, password)) {
      setOpen(false)
      setUsername('')
      setPassword('')
      setError('')
      return
    }
    setError('Usuario o clave incorrecta')
  }

  if (user) {
    return (
      <div className="relative flex shrink-0 items-center gap-2">
        <span
          className={[
            'hidden rounded-full px-2.5 py-1 text-xs font-black leading-snug sm:inline-flex',
            canEdit ? 'bg-[var(--album-green-soft)] text-[var(--album-green-dark)]' : 'bg-[#f3f3f3] text-[var(--album-muted)]',
          ].join(' ')}
        >
          {canEdit ? 'Admin' : 'Lectura'}
        </span>
        <button type="button" onClick={onLogout} className="album-button-secondary px-3 text-sm">
          Salir
        </button>
      </div>
    )
  }

  return (
    <div className="relative shrink-0">
      <button type="button" onClick={() => setOpen((value) => !value)} className="album-button-secondary px-3 text-sm">
        Login
      </button>
      {open && (
        <form
          onSubmit={submitLogin}
          className="absolute right-0 top-[calc(100%+8px)] z-20 w-[min(82vw,280px)] rounded-[var(--album-radius)] border-2 border-[var(--album-line)] bg-white p-3 shadow-[0_8px_0_rgba(60,60,60,0.12)]"
        >
          <div className="grid gap-2">
            <label htmlFor={usernameId} className="text-xs font-black uppercase tracking-[0.08em] text-[var(--album-muted)]">
              Usuario
            </label>
            <input
              id={usernameId}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="min-h-11 rounded-[var(--album-control-radius)] border-2 border-[var(--album-line)] px-3 text-sm font-bold outline-none focus:border-[var(--album-blue)]"
            />
            <label htmlFor={passwordId} className="text-xs font-black uppercase tracking-[0.08em] text-[var(--album-muted)]">
              Clave
            </label>
            <input
              id={passwordId}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="min-h-11 rounded-[var(--album-control-radius)] border-2 border-[var(--album-line)] px-3 text-sm font-bold outline-none focus:border-[var(--album-blue)]"
            />
            {error && <p className="text-xs font-black text-[var(--album-pink)]">{error}</p>}
            <button type="submit" className="album-button-primary mt-1 px-4 text-sm">
              Entrar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
