import { useVault } from '../VaultContext'
import Avatar from './Avatar'

export default function Header({ tabs }) {
  const { state, set, logout, isAdmin, canSeeTrash } = useVault()

  const visibleTabs = tabs.filter((t) => {
    if (t === 'TRASH') return canSeeTrash
    return true
  })

  return (
    <header className="header">
      <div className="header-in">
        <div className="who">
          <Avatar member={state.me} size="sm" />
          <span>
            <span className="who-b">{state.me.name}</span>
            {state.me.isAdmin && (
              <>
                {' '}<span className="tag admin">ADMIN</span>
              </>
            )}
            {state.me.isGuest && (
              <>
                {' '}<span className="tag guest">GUEST</span>
              </>
            )}
          </span>
          <button className="btn mini" onClick={logout}>LOGOUT</button>
        </div>

        <nav className="tabs" aria-label="Vault sections">
          {visibleTabs.map((t) => {
            const count = t === 'TRASH' && state.trash.length ? ` (${state.trash.length})` : ''
            const danger = (t === 'ADMIN' || t === 'TRASH') && state.tab !== t
            return (
              <button
                key={t}
                className={`tab ${state.tab === t ? 'active' : ''} ${danger ? 'tab-admin-style' : ''}`}
                style={danger ? { background: '#1A1220', borderColor: '#3A1A2A', color: 'var(--danger)' } : undefined}
                onClick={() => set({ tab: t, selectMode: false, selected: [] })}
              >
                {t}{count}
              </button>
            )
          })}
        </nav>

        <div className="search" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            className="input"
            style={{ height: 36 }}
            placeholder="🔍 SEARCH MEMORIES…"
            value={state.search}
            onChange={(e) => set({ search: e.target.value })}
            aria-label="Search memories"
          />
          {state.search && (
            <button className="btn mini" onClick={() => set({ search: '' })} aria-label="Clear search">✕</button>
          )}
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`btn mini ${state.selectMode ? 'primary' : ''}`}
              onClick={() => set({ selectMode: !state.selectMode, selected: [] })}
            >
              {state.selectMode ? 'EXIT SELECT' : '☑ SELECT'}
            </button>
            {state.selectMode && state.selected.length > 0 && (
              <button className="btn mini danger" onClick={() => set({ selectMode: false, selected: [] })}>
                CLEAR ({state.selected.length})
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
