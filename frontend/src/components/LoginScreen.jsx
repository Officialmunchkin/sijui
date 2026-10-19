import { useVault } from '../VaultContext'
import Avatar from './Avatar'

export default function LoginScreen() {
  const { state, set, submitLogin, continueAsGuest } = useVault()

  const pick = (m) => {
    set({ pendingId: m.id, pwInput: '', pwError: '' })
    setTimeout(() => document.getElementById('login-pw')?.focus(), 50)
  }

  const pending = state.members.find((m) => m.id === state.pendingId)

  return (
    <div className="login">
      <div className="login-inner">
        <div className="logo-big">FAM VAULT</div>
        <div className="login-sub">THE KASHI FAMILY • PRIVATE MEMORY VAULT</div>

        <div className="member-grid">
          {state.members.map((m) => (
            <div
              key={m.id}
              className={`member-card ${state.pendingId === m.id ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => pick(m)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(m) } }}
            >
              <div className="member-top">
                <Avatar member={m} />
                <span className="dot" title="ACTIVE" />
              </div>
              <div className="member-name">
                {m.name}
                {m.isAdmin && <span className="tag admin">ADMIN</span>}
              </div>
              <div className="member-handle">@{m.handle || m.id}</div>
              <div className="member-relation">{m.relation}</div>
            </div>
          ))}
        </div>

        {pending && (
          <div className="card" style={{ marginTop: 24, textAlign: 'left' }}>
            <div className="field-label">PASSWORD FOR {pending.name}</div>
            <input
              id="login-pw"
              className="input"
              type="password"
              autoFocus
              value={state.pwInput}
              placeholder="ENTER PASSWORD"
              onChange={(e) => set({ pwInput: e.target.value, pwError: '' })}
              onKeyDown={(e) => { if (e.key === 'Enter') submitLogin() }}
            />
            {state.pwError && <div className="err-box">{state.pwError}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn" onClick={() => set({ pendingId: null, pwError: '', pwInput: '' })}>
                ← BACK
              </button>
              <button className="btn primary" style={{ flex: 1 }} onClick={submitLogin}>
                LOGIN →
              </button>
            </div>
            <div style={{ marginTop: 14, textAlign: 'center', fontSize: 9, letterSpacing: '.2em', color: '#3A3A5A' }}>
              VAULT SECURE • FIRST LOGIN SETS YOUR PASSWORD
            </div>
          </div>
        )}

        <div className="login-actions">
          <button className="btn" onClick={continueAsGuest}>
            👤 CONTINUE AS GUEST
          </button>
        </div>
      </div>
    </div>
  )
}
