import { useVault } from '../VaultContext'

export default function RenameAlbumModal() {
  const { state, set, renameAlbum, toast } = useVault()

  const close = () => set({ renameAlbumId: null, renameAlbumName: '' })

  const go = async () => {
    const name = (state.renameAlbumName || '').trim().toUpperCase()
    if (!name) return toast('ENTER ALBUM NAME')
    try {
      await renameAlbum(state.renameAlbumId, name)
      close()
    } catch (e) { toast(e.message || 'RENAME FAILED') }
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Rename album">
      <div className="backdrop" onClick={close} />
      <div className="modal" style={{ maxWidth: 380 }}>
        <button className="x" onClick={close} aria-label="Close">✕</button>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.22em', color: '#fff' }}>✎ RENAME ALBUM</div>
        <div style={{ marginTop: 4, fontSize: 9, letterSpacing: '.2em', color: 'var(--dim)' }}>{state.renameAlbumId}</div>

        <div style={{ marginTop: 16 }}>
          <div className="field-label">NEW NAME</div>
          <input
            className="input"
            value={state.renameAlbumName}
            onChange={(e) => set({ renameAlbumName: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') go() }}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button className="btn" onClick={close}>CANCEL</button>
          <button className="btn primary" style={{ flex: 1 }} onClick={go}>RENAME →</button>
        </div>
      </div>
    </div>
  )
}
