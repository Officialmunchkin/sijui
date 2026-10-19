import { useVault } from '../VaultContext'
import Avatar from './Avatar'
import { fileURL } from '../api'
import { formatBytes, timeAgo } from '../utils'

const TEN_GB = 10737418240 // 10 * 1024^3

export default function AdminTab() {
  const {
    state, set, isAdmin,
    removeMember, adminSetPassword, deleteAlbum, emptyTrash,
    restorePhotos, deletePhotoForever, viewPasswords, downloadAlbumZip,
    editBoardPost, deleteBoardPost, toast,
  } = useVault()

  if (!isAdmin) {
    return <div className="empty">ADMIN ACCESS ONLY — SORRY 😬</div>
  }

  const setCount = state.members.filter((m) => m.hasPassword).length

  /* ---- storage: active + trashed bytes vs the 10GB budget ---- */
  const usedBytes =
    state.photos.reduce((s, p) => s + (p.size || 0), 0) +
    state.trash.reduce((s, p) => s + (p.size || 0), 0)
  const pct = Math.min(100, (usedBytes / TEN_GB) * 100)

  /* ---- activity log, derived from who trashed what (grouped) ---- */
  const activity = (() => {
    const map = new Map()
    for (const p of state.trash) {
      const who = (p.deletedBy || 'UNKNOWN').toUpperCase()
      const album = (p.originalAlbum || p.album || 'UNKNOWN').toUpperCase()
      const at = p.trashedAt || 0
      const key = `${who}|${album}|${at}`
      if (!map.has(key)) map.set(key, { who, album, at, count: 0 })
      map.get(key).count++
    }
    return [...map.values()].sort((a, b) => b.at - a.at)
  })()

  const pwList = state.adminPasswords

  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.25em', color: 'var(--danger)' }}>
        ⚠ ADMIN PANEL
      </div>

      {/* ---------- STORAGE ---------- */}
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, letterSpacing: '.3em', color: '#C4B5FD', fontWeight: 700 }}>
            STORAGE
          </div>
          <div style={{ fontSize: 10, letterSpacing: '.16em', color: 'var(--muted)' }}>
            {formatBytes(usedBytes)} / 10 GB • {pct.toFixed(1)}%
          </div>
        </div>
        <div style={{ marginTop: 12, height: 10, borderRadius: 999, background: 'var(--surface2)', overflow: 'hidden', border: '1px solid var(--line)' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,var(--accent2),var(--accent))', transition: 'width .3s' }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 9, letterSpacing: '.16em', color: 'var(--dim)' }}>
          {state.photos.length} ACTIVE + {state.trash.length} IN TRASH
        </div>
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
            PASSWORDS • SET / RESET / VIEW
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, padding: '4px 8px', borderRadius: 999, background: 'rgba(139,92,246,.2)', border: '1px solid rgba(139,92,246,.3)', color: '#C4B5FD' }}>
              {setCount}/{state.members.length} SET
            </span>
            <button
              className="btn mini"
              onClick={() => {
                if (pwList) set({ adminPasswords: null })
                else viewPasswords().catch((e) => toast(e.message || 'COULD NOT LOAD'))
              }}
            >
              {pwList ? '🙈 HIDE PASSWORDS' : '👁 VIEW ALL PASSWORDS'}
            </button>
          </div>
        </div>

        {pwList && (
          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            {pwList.map((p) => (
              <div key={p.id} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface2)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 120, fontSize: 11, fontWeight: 800, letterSpacing: '.14em', color: '#fff' }}>
                  {p.name}
                </div>
                <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 11, letterSpacing: '.1em', color: p.password ? 'var(--ok)' : 'var(--dim)' }}>
                  {p.password ? p.password : '— NOT SET —'}
                </div>
              </div>
            ))}
          </div>
        )}

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
            ALBUMS • CREATE / DELETE / ZIP
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
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className="btn mini"
                    onClick={() => downloadAlbumZip(a).catch((e) => toast(e.message || 'ZIP FAILED'))}
                  >
                    ⬇ ZIP
                  </button>
                  <button
                    className="btn mini danger"
                    onClick={() => deleteAlbum(a).catch((e) => toast(e.message || 'DELETE FAILED'))}
                  >
                    🗑 DELETE
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 9, letterSpacing: '.16em', color: 'var(--dim)' }}>
          DELETING AN ALBUM SENDS ITS PHOTOS STRAIGHT TO TRASH — THEY CAN BE RESTORED FROM THE TRASH TAB.
        </div>
      </div>

      {/* ---------- ACTIVITY LOG ---------- */}
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, letterSpacing: '.3em', color: '#C4B5FD', fontWeight: 700 }}>
          ACTIVITY LOG
        </div>
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          {activity.length ? (
            activity.map((ev, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface2)', fontSize: 10, letterSpacing: '.12em', color: 'var(--txt)' }}>
                <span style={{ color: '#fff', fontWeight: 800 }}>{ev.who}</span>
                <span style={{ color: 'var(--muted)' }}> DELETED </span>
                <span style={{ color: '#fff', fontWeight: 800 }}>{ev.album}</span>
                <span style={{ color: 'var(--muted)' }}> ({ev.count} {ev.count === 1 ? 'PHOTO' : 'PHOTOS'})</span>
                <span style={{ color: 'var(--dim)' }}> — {timeAgo(ev.at)}</span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 9, letterSpacing: '.18em', color: 'var(--dim)' }}>NO RECENT ACTIVITY</div>
          )}
        </div>
      </div>

      {/* ---------- BOARD MANAGEMENT ---------- */}
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, letterSpacing: '.3em', color: '#C4B5FD', fontWeight: 700 }}>
          BOARD • ADMIN CAN EDIT / DELETE ANY POST
        </div>
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          {state.board.length ? (
            state.board.map((p) => (
              <div key={p.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface2)', display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', color: p.color || '#fff' }}>
                    {p.user} <span style={{ color: 'var(--dim)', fontWeight: 400 }}>• {timeAgo(p.at)}</span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10, letterSpacing: '.06em', color: 'var(--txt)', wordBreak: 'break-word' }}>{p.text}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn mini" onClick={() => editBoardPost(p.id, p.text).catch((e) => toast(e.message || 'EDIT FAILED'))}>✎</button>
                  <button className="btn mini danger" onClick={() => deleteBoardPost(p.id).catch((e) => toast(e.message || 'DELETE FAILED'))}>🗑</button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 9, letterSpacing: '.18em', color: 'var(--dim)' }}>NO BOARD POSTS</div>
          )}
        </div>
      </div>

      {/* ---------- TRASH MANAGEMENT ---------- */}
      <div className="card" style={{ marginTop: 14, borderColor: 'rgba(255,107,138,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, letterSpacing: '.3em', color: 'var(--danger)', fontWeight: 700 }}>
            TRASH • {state.trash.length} ITEMS
          </div>
          {state.trash.length > 0 && (
            <button
              className="btn mini danger"
              onClick={() => emptyTrash().catch((e) => toast(e.message || 'EMPTY FAILED'))}
            >
              🗑 EMPTY TRASH
            </button>
          )}
        </div>

        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          {state.trash.length ? (
            state.trash.map((p) => (
              <div key={p.id} style={{ padding: 10, borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface2)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', background: '#05050C', flexShrink: 0 }}>
                  {p.type === 'video' ? (
                    <video src={p.src || fileURL(p.key)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  ) : (
                    <img src={p.src || fileURL(p.key)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', color: '#fff', wordBreak: 'break-word' }}>
                    {p.caption || 'UNTITLED'}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 9, letterSpacing: '.14em', color: 'var(--muted)' }}>
                    ← {(p.originalAlbum || p.album || '').toUpperCase()}
                    {p.size ? ` • ${formatBytes(p.size)}` : ''}
                  </div>
                  <div style={{ marginTop: 3, fontSize: 9, letterSpacing: '.14em', color: 'var(--dim)' }}>
                    {p.deletedBy ? `DELETED BY ${String(p.deletedBy).toUpperCase()}` : 'DELETED'}
                    {p.trashedAt ? ` • ${timeAgo(p.trashedAt)}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className="btn mini"
                    onClick={() => restorePhotos([p.id]).then(() => toast('RESTORED')).catch((e) => toast(e.message || 'RESTORE FAILED'))}
                  >
                    ↩ RESTORE
                  </button>
                  <button
                    className="btn mini danger"
                    onClick={() => { if (!confirm('PERMANENTLY DELETE THIS PHOTO? THIS CANNOT BE UNDONE.')) return; deletePhotoForever(p.id).catch((e) => toast(e.message || 'DELETE FAILED')) }}
                  >
                    🗑 PERMANENT
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 9, letterSpacing: '.18em', color: 'var(--dim)' }}>TRASH IS EMPTY</div>
          )}
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
            onClick={() => emptyTrash().catch((e) => toast(e.message || 'EMPTY FAILED'))}
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
