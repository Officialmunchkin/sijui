import { useVault } from '../VaultContext'
import PhotoCard from './PhotoCard'
import { fileURL } from '../api'

export default function AlbumsTab() {
  const {
    state, set, filteredPhotos, isAdmin, isGuest,
    createAlbum, renameAlbum, deleteAlbum, movePhotos, trashPhotos, toast,
  } = useVault()

  const photos = filteredPhotos()
  const selected = state.selected

  const countIn = (name) => state.photos.filter((p) => p.album === name).length

  const coverFor = (name) => {
    const first = state.photos.find((p) => p.album === name && p.type !== 'video')
    return first ? (first.src || fileURL(first.key)) : null
  }

  const bulkMove = async (album) => {
    if (!selected.length) return
    try {
      await movePhotos(selected, album)
      set({ selected: [] })
      toast(`MOVED ${selected.length} → ${album}`)
    } catch (e) { toast(e.message || 'MOVE FAILED') }
  }

  const bulkTrash = async () => {
    if (!selected.length) return
    if (!confirm(`MOVE ${selected.length} PHOTOS TO TRASH?`)) return
    try {
      await trashPhotos(selected)
      set({ selected: [] })
      toast('MOVED TO TRASH')
    } catch (e) { toast(e.message || 'TRASH FAILED') }
  }

  return (
    <>
      {state.selectMode && selected.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(139,92,246,.5)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.2em', color: '#C4B5FD' }}>
            {selected.length} SELECTED
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {state.albums.map((a) => (
              <button key={a} className="btn mini chip-album" onClick={() => bulkMove(a)}>
                → {a}
              </button>
            ))}
            <button className="btn mini danger" onClick={bulkTrash}>🗑 MOVE TO TRASH</button>
            <button className="btn mini" onClick={() => set({ selected: [] })}>CLEAR</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.25em', color: '#fff' }}>
          ALBUMS
        </div>
        {isAdmin && (
          <button className="btn mini primary" onClick={() => set({ newAlbumOpen: true, newAlbumTitle: '' })}>
            + NEW ALBUM
          </button>
        )}
      </div>

      <div className="album-grid" style={{ marginTop: 14 }}>
        <div
          className="card album-card"
          role="button"
          tabIndex={0}
          style={{
            cursor: 'pointer', textAlign: 'left',
            borderColor: state.albumFilter === 'ALL' ? 'rgba(139,92,246,.6)' : 'var(--line)',
            background: state.albumFilter === 'ALL' ? 'rgba(139,92,246,.1)' : 'var(--surface)',
          }}
          onClick={() => set({ albumFilter: 'ALL' })}
          onKeyDown={(e) => { if (e.key === 'Enter') set({ albumFilter: 'ALL' }) }}
        >
          <div style={{ fontSize: 20 }}>🗂</div>
          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 800, letterSpacing: '.18em', color: '#fff' }}>ALL</div>
          <div style={{ marginTop: 4, fontSize: 10, letterSpacing: '.18em', color: 'var(--dim)' }}>
            {state.photos.length} MEMORIES
          </div>
        </div>

        {state.albums.map((a) => {
          const cover = coverFor(a)
          const count = countIn(a)
          return (
            <div
              key={a}
              className="card album-card"
              role="button"
              tabIndex={0}
              style={{
                cursor: 'pointer', textAlign: 'left', padding: 0, overflow: 'hidden',
                borderColor: state.albumFilter === a ? 'rgba(139,92,246,.6)' : 'var(--line)',
              }}
              onClick={() => set({ albumFilter: a })}
              onKeyDown={(e) => { if (e.key === 'Enter') set({ albumFilter: a }) }}
              aria-label={`Open album ${a}`}
            >
              <div style={{ position: 'relative', height: 110, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {cover ? (
                  <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 28 }}>📷</span>
                )}
                {isAdmin && (
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                    <button
                      className="mini"
                      title="Rename album"
                      aria-label={`Rename album ${a}`}
                      style={{ width: 28, height: 28, background: 'rgba(26,26,46,.9)', border: '1px solid var(--line)', color: '#fff', fontSize: 10, borderRadius: '50%' }}
                      onClick={(e) => { e.stopPropagation(); set({ renameAlbumId: a, renameAlbumName: a }) }}
                    >
                      ✎
                    </button>
                    <button
                      className="mini"
                      title="Delete album"
                      aria-label={`Delete album ${a}`}
                      style={{ width: 28, height: 28, background: 'rgba(26,18,32,.9)', border: '1px solid #3A1A2A', color: 'var(--danger)', fontSize: 10, borderRadius: '50%' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteAlbum(a)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.18em', color: '#fff' }}>{a}</div>
                <div style={{ marginTop: 4, fontSize: 10, letterSpacing: '.18em', color: 'var(--dim)' }}>{count} MEMORIES</div>
                <div style={{ marginTop: 10, fontSize: 10, fontWeight: 800, letterSpacing: '.18em', color: 'var(--accent)' }}>
                  VIEW ALBUM →
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.25em', color: '#fff' }}>
          {state.albumFilter === 'ALL' ? 'ALL MEMORIES' : state.albumFilter}
          {' '}<span style={{ color: 'var(--dim)' }}>({photos.length})</span>
        </div>
        {!isGuest && (
          <button className="btn mini primary" onClick={() => set({ uploadOpen: true, uploadAlbum: state.albumFilter === 'ALL' ? (state.albums[0] || '') : state.albumFilter })}>
            + UPLOAD HERE
          </button>
        )}
      </div>

      <div className="masonry lg" style={{ marginTop: 14 }}>
        {photos.length ? (
          photos.slice(0, state.visibleLimit).map((p) => <PhotoCard key={p.id} photo={p} />)
        ) : (
          <div className="empty">NO PHOTOS IN THIS VIEW</div>
        )}
      </div>
    </>
  )
}
