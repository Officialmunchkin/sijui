import { useState } from 'react'
import { useVault } from '../VaultContext'
import Avatar from './Avatar'

function timeAgo(ms) {
  if (!ms) return ''
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if (s < 60) return 'JUST NOW'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}M AGO`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}H AGO`
  const d = Math.floor(h / 24)
  return `${d}D AGO`
}

export default function BoardTab() {
  const { state, isGuest, isAdmin, postBoard, editBoardPost, deleteBoardPost, toast } = useVault()
  const [draft, setDraft] = useState('')

  const submit = async () => {
    if (!draft.trim()) return
    try {
      await postBoard(draft)
      setDraft('')
      toast('POSTED TO BOARD')
    } catch (e) { toast(e.message || 'POST FAILED') }
  }

  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.25em', color: '#fff' }}>
        FAMILY BOARD
      </div>

      {!isGuest && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="field-label">POST AN UPDATE</div>
          <textarea
            className="input"
            style={{ minHeight: 70, padding: 12 }}
            maxLength={500}
            placeholder="SHARE NEWS, PLANS, DEMANDS…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button className="btn primary" disabled={!draft.trim()} onClick={submit}>
              POST →
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {state.board.length ? (
          state.board.map((p) => {
            const member = state.members.find((m) => m.id === p.member_id || m.name === p.user)
            const canEdit = isAdmin || p.member_id === state.me?.id || p.user === state.me?.name
            return (
              <div key={p.id} className="board-post">
                <Avatar member={member || { name: p.user, color: p.color }} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', color: p.color || '#fff' }}>
                      {p.user}
                    </span>
                    <span style={{ fontSize: 9, letterSpacing: '.16em', color: 'var(--dim)' }}>
                      {timeAgo(p.at)}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, letterSpacing: '.08em', lineHeight: 1.6, color: 'var(--txt)', wordBreak: 'break-word' }}>
                    {p.text}
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button className="btn mini" onClick={() => editBoardPost(p.id, p.text).catch((e) => toast(e.message || 'EDIT FAILED'))}>
                        ✎ EDIT
                      </button>
                      <button className="btn mini danger" onClick={() => deleteBoardPost(p.id).catch((e) => toast(e.message || 'DELETE FAILED'))}>
                        🗑 DELETE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="empty">NO POSTS YET — SAY HI ON THE BOARD</div>
        )}
      </div>
    </>
  )
}
