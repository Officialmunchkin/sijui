import { useVault } from '../VaultContext'

const COLORS = ['#6366F1', '#06B6D4', '#EC4899', '#F59E0B', '#8B5CF6', '#14B8A6', '#FF6B8A', '#10B981']

export default function EditMemberModal() {
  const { state, set, saveEditMember, blankMember, toast } = useVault()
  const f = state.editMember
  const upd = (p) => set({ editMember: { ...f, ...p } })
  const close = () => set({ editMemberId: null, editMember: blankMember() })

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Edit member">
      <div className="backdrop" onClick={close} />
      <div className="modal">
        <button className="x" onClick={close} aria-label="Close">✕</button>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.22em', color: '#fff' }}>✎ EDIT MEMBER</div>
        <div style={{ marginTop: 4, fontSize: 9, letterSpacing: '.2em', color: 'var(--dim)' }}>@{state.editMemberId}</div>

        <div style={{ marginTop: 16 }}>
          <div className="field-label">NAME *</div>
          <input className="input" value={f.name} onChange={(e) => upd({ name: e.target.value })} autoFocus />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <div className="field-label">RELATION</div>
            <input className="input" value={f.relation || ''} onChange={(e) => upd({ relation: e.target.value })} />
          </div>
          <div>
            <div className="field-label">BIRTHDAY (MM-DD)</div>
            <input className="input" placeholder="05-12" value={f.birthday || ''} onChange={(e) => upd({ birthday: e.target.value })} />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="field-label">BIO (MAX 150)</div>
          <textarea className="input" style={{ minHeight: 70, padding: 12 }} maxLength={150} value={f.bio || ''} onChange={(e) => upd({ bio: e.target.value })} />
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="field-label">COLOR</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => upd({ color: c })}
                aria-label={`Pick color ${c}`}
                style={{
                  width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: f.color === c ? '3px solid #fff' : '2px solid transparent',
                  boxShadow: f.color === c ? `0 0 12px ${c}` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button className="btn" onClick={close}>CANCEL</button>
          <button className="btn primary" style={{ flex: 1 }} onClick={() => saveEditMember().catch((e) => toast(e.message || 'SAVE FAILED'))}>
            SAVE CHANGES →
          </button>
        </div>
      </div>
    </div>
  )
}
