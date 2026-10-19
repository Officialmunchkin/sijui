import { useVault } from '../VaultContext'
import PhotoCard from './PhotoCard'
import { formatBytes } from '../utils'

export default function HomeTab() {
  const { state, set, filteredPhotos, isGuest } = useVault()

  const photos = filteredPhotos()
  const totalBytes = state.photos.reduce((sum, p) => sum + (p.size || 0), 0)

  const quick = [
    { label: '📷 UPLOAD', action: () => !isGuest && set({ uploadOpen: true, uploadAlbum: state.albums[0] || '' }) },
    { label: '🗂 VIEW ALBUMS', action: () => set({ tab: 'ALBUMS' }) },
    { label: '👨‍👩‍👧 MEMBERS', action: () => set({ tab: 'MEMBERS' }) },
    { label: '📋 BOARD', action: () => set({ tab: 'BOARD' }) },
  ]

  return (
    <>
      <section className="card">
        <div style={{ fontSize: 11, letterSpacing: '.3em', color: 'var(--muted)', fontWeight: 700 }}>
          FAMILY MEMORY VAULT
        </div>
        <div style={{ marginTop: 14 }} className="stat3 home-stats">
          <div className="stat-box">
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{state.photos.length}</div>
            <div className="stat-lbl">PHOTOS</div>
          </div>
          <div className="stat-box">
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{state.albums.length}</div>
            <div className="stat-lbl">ALBUMS</div>
          </div>
          <div className="stat-box">
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{state.members.length}</div>
            <div className="stat-lbl">MEMBERS</div>
          </div>
          <div className="stat-box">
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>{formatBytes(totalBytes)}</div>
            <div className="stat-lbl">TOTAL STORAGE</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {quick
            .filter((q) => !(isGuest && q.label.includes('UPLOAD')))
            .map((q) => (
            <button
              key={q.label}
              className="btn"
              onClick={q.action}
            >
              {q.label}
            </button>
          ))}
        </div>
      </section>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.25em', color: '#fff' }}>
          RECENT MEMORIES
        </div>
        {state.photos.length > state.visibleLimit && (
          <button className="btn mini" onClick={() => set({ visibleLimit: state.visibleLimit + 100 })}>
            SHOW MORE ↓
          </button>
        )}
      </div>

      <div className="masonry">
        {photos.length ? (
          photos.slice(0, state.visibleLimit).map((p) => <PhotoCard key={p.id} photo={p} />)
        ) : (
          <div className="empty">NO PHOTOS YET — HIT + TO UPLOAD YOUR FIRST MEMORY</div>
        )}
      </div>
    </>
  )
}
