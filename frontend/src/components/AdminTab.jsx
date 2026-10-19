import { useVault } from '../VaultContext'
import Avatar from './Avatar'

export default function AdminTab() {
  const {
    state, set, isAdmin,
    removeMember, adminSetPassword, deleteAlbum, emptyTrash, toast,
  } = useVault()

  if (!isAdmin) {
    return <div className="empty">ADMIN ACCESS ONLY — SORRY 😬</div>
  }

  const setCount = state.members.filter((m) => m.hasPassword).length

  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.25em', color: 'var(--danger)' }}>
        ⚠ ADMIN PANEL
      </div>

      {/* ---------- MEMBERS MANAGEMENT ---------- */}
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, letterSpacing: '.3em', color: '#C4B5FD', fontWeight: 700 }}>
            MEMBERS • ADD / EDIT / REMOVE
          </div>
          <button className="btn mini primary" onClick={() => set({ addMemberOpen: true })}>+ ADD MEMBER</button>
        </div>
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {state.members.map((m) => (
            <div
              key={m.id}
              style={{ padding: 14, borderRadius: 16, border: '1px solid var(--line)', background: 'var(--surface2)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Avatar member={m} size="sm" />
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', color: '#fff' }}>
                  {m.name} {m.isAdmin && <span className="tag admin">ADMIN</span>}
                </div>
                <div style={{ fontSize: 9, letterSpacing: '.16em', color: 'var(--dim)' }}>
                  @{m.handle || m.id} • {m.relation || 'FAMILY'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn mini" onClick={() => set({ editMemberId: m.id, editMember: { ...m } })}>✎ EDIT</button>
                {!m.isAdmin && (
                  <button className="btn mini danger" onClick={() => removeMember(m.id).catch((e) => toast(e.message || 'REMOVE FAILED'))}>
                    🗑 REMOVE
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- PASSWORDS ---------- */}
      <div className="card" style={{ marginTop: 14, borderColor: 'rgba(139,92,246,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, letterSpacing: '.3em', color: '#C4B5FD', fontWeight: 700 }}>
            PASSWORDS • ADMIN CAN SET / RESET
          </div>
          <span style={{ fontSize: 9, padding: '4px 8px', borderRadius: 999, background: 'rgba(139,92,246,.2)', border: '1px solid rgba(139,92,246,.3)', color: '#C4B5FD' }}>
            {setCount}/{state.members.length} SET
          </span>
        </div>
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {state.members.map((m) => (
            <div key={m.id} style={{ padding: 14, borderRadius: 16, border: '1px solid var(--line)', background: 'var(--surface2)', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div className="field-label">NEW PASSWORD FOR {m.name}</div>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={state.adminPwDrafts[m.id] || ''}
                  onChange={(e) => set({ adminPwDrafts: { ...state.adminPwDrafts, [m.id]: e.target.value } })}
                />
              </div>
              <button className="btn mini primary" onClick={() => adminSetPassword(m.id).catch((e) => toast(e.message || 'SET FAILED'))}>
                SET PASSWORD
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- ALBUMS ---------- */}
      <div className="card" style={{ marginTop: 14, borderColor: 'rgba(236,72,153,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, letterSpacing: '.3em', color: '#F9A8D4', fontWeight: 700 }}>
            ALBUMS • CREATE / DELETE
          </div>
          <button className="btn mini primary" onClick={() => set({ newAlbumOpen: true, newAlbumTitle: '' })}>+ NEW ALBUM</button>
        </div>
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {state.albums.map((a) => {
            const count = state.photos.filter((p) => p.album === a).length
            return (
              <div key={a} style={{ padding: 12, borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface2)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', color: '#fff' }}>{a}</div>
                  <div style={{ fontSize: 9, letterSpacing: '.16em', color: 'var(--dim)' }}>{count} MEMORIES</div>
                </div>
                <button
                  className="btn mini danger"
                  onClick={() => {
                    if (!confirm(`DELETE ALBUM ${a}? ALL ${count} PHOTOS WILL GO TO TRASH`)) return
                    deleteAlbum(a).catch((e) => toast(e.message || 'DELETE FAILED'))
                  }}
                >
                  🗑 DELETE
                </button>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 9, letterSpacing: '.16em', color: 'var(--dim)' }}>
          DELETING AN ALBUM SENDS ITS PHOTOS STRAIGHT TO TRASH — THEY CAN BE RESTORED FROM THE TRASH TAB.
        </div>
      </div>

      {/* ---------- DANGER ZONE ---------- */}
      <div className="card" style={{ marginTop: 14, borderColor: 'rgba(255,107,138,.3)' }}>
        <div style={{ fontSize: 11, letterSpacing: '.3em', color: 'var(--danger)', fontWeight: 700 }}>
          DANGER ZONE
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn danger"
            onClick={() => {
              if (!state.trash.length) { toast('TRASH IS EMPTY'); return }
              if (!confirm(`EMPTY TRASH? ${state.trash.length} ITEMS WILL BE PERMANENTLY DELETED.`)) return
              emptyTrash().catch((e) => toast(e.message || 'EMPTY FAILED'))
            }}
          >
            🗑 EMPTY TRASH ({state.trash.length})
          </button>
        </div>
        <div style={{ marginTop: 10, fontSize: 9, letterSpacing: '.16em', color: 'var(--dim)' }}>
          PERMANENT DELETES CANNOT BE UNDONE — FILES ARE PURGED FROM R2 STORAGE.
        </div>
      </div>
    </>
  )
}
