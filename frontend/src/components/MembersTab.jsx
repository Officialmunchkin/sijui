import { useVault } from '../VaultContext'
import Avatar from './Avatar'
import { bdayInfo } from '../utils'

export default function MembersTab() {
  const { state, set, isAdmin, isGuest, saveBio } = useVault()

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.25em', color: '#fff' }}>
          FAMILY MEMBERS <span style={{ color: 'var(--dim)' }}>({state.members.length})</span>
        </div>
        {isAdmin && (
          <button className="btn mini primary" onClick={() => set({ addMemberOpen: true })}>
            + ADD MEMBER
          </button>
        )}
      </div>

      <div className="members-grid" style={{ marginTop: 14 }}>
        {state.members.map((m) => {
          const bday = bdayInfo(m)
          return (
            <div key={m.id} className="card">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Avatar member={m} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.15em', color: '#fff' }}>{m.name}</span>
                    {m.isAdmin && <span className="tag admin">ADMIN</span>}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10, letterSpacing: '.18em', color: 'var(--dim)' }}>
                    @{m.handle || m.id} • {m.relation || 'FAMILY'}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 9, letterSpacing: '.16em', fontWeight: 700, color: bday.isToday ? 'var(--ok)' : (bday.days !== null && bday.days <= 7 ? 'var(--amber)' : 'var(--muted)') }}>
                    🎂 {bday.text}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                {state.bioEditId === m.id ? (
                  <>
                    <textarea
                      className="input"
                      style={{ minHeight: 70, padding: 12 }}
                      maxLength={150}
                      value={state.bioDraft}
                      onChange={(e) => set({ bioDraft: e.target.value })}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button className="btn mini" onClick={() => set({ bioEditId: null, bioDraft: '' })}>CANCEL</button>
                      <button className="btn mini primary" style={{ flex: 1 }} onClick={() => saveBio().catch(() => {})}>SAVE BIO</button>
                    </div>
                  </>
                ) : (
                  <div
                    onDoubleClick={() => { if (isAdmin || state.me?.id === m.id) set({ bioEditId: m.id, bioDraft: m.bio || '' }) }}
                    style={{ fontSize: 10, letterSpacing: '.1em', lineHeight: 1.7, color: 'var(--muted)', cursor: (isAdmin || state.me?.id === m.id) ? 'text' : 'default' }}
                    title={(isAdmin || state.me?.id === m.id) ? 'Double-click to edit bio' : undefined}
                  >
                    {m.bio || 'NO BIO YET.'}
                    {(isAdmin || state.me?.id === m.id) && (
                      <button
                        className="btn mini"
                        style={{ marginLeft: 8, height: 20, padding: '0 8px', fontSize: 8 }}
                        onClick={() => set({ bioEditId: m.id, bioDraft: m.bio || '' })}
                      >
                        ✎ EDIT
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isAdmin && !m.isAdmin && (
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <button
                    className="btn mini"
                    style={{ flex: 1 }}
                    onClick={() => set({ editMemberId: m.id, editMember: { ...m } })}
                  >
                    ✎ EDIT
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!isAdmin && (
        <div style={{ marginTop: 16, fontSize: 9, letterSpacing: '.2em', color: 'var(--dim)', textAlign: 'center' }}>
          ONLY ADMIN CAN ADD OR EDIT MEMBERS
        </div>
      )}
      {isGuest && (
        <div style={{ marginTop: 8, fontSize: 9, letterSpacing: '.2em', color: 'var(--dim)', textAlign: 'center' }}>
          GUESTS HAVE VIEW-ONLY ACCESS
        </div>
      )}
    </>
  )
}
