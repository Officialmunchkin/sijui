import { useVault } from '../VaultContext'

export default function NewAlbumModal() {
  const { state, set, createAlbum, toast } = useVault()

  const close = () => set({ newAlbumOpen: false, newAlbumTitle: '' })

  const go = async () => {
    const name = (state.newAlbumTitle || '').trim().toUpperCase()
    if (!name) return toast('ENTER ALBUM NAME')
    const ok = await createAlbum(name).catch((e) => { toast(e.message || 'CREATE FAILED'); return false })
    if (ok !== false) close()
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="New album">
      <div className="backdrop" onClick={close} />
      <div className="modal" style={{ maxWidth: 380 }}>
        <button className="x" onClick={close} aria-label="Close">✕</button>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.22em', color: '#fff' }}>📁 NEW ALBUM</div>

        <div style={{ marginTop: 16 }}>
          <div className="field-label">ALBUM NAME</div>
          <input
            className="input"
            placeholder="E.G. EASTER 25"
            value={state.newAlbumTitle}
            onChange={(e) => set({ newAlbumTitle: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') go() }}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button className="btn" onClick={close}>CANCEL</button>
          <button className="btn primary" style={{ flex: 1 }} onClick={go}>CREATE →</button>
        </div>
      </div>
    </div>
  )
}
