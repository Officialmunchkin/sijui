import { fileURL } from '../api'
import { formatBytes } from '../utils'
import { useVault } from '../VaultContext'

export default function TrashCard({ photo }) {
  const { state, set, restorePhotos, deletePhotoForever, toast } = useVault()

  const selected = state.selected.includes(photo.id)

  const toggle = (e) => {
    e.stopPropagation()
    set({ selected: selected ? state.selected.filter((id) => id !== photo.id) : [...state.selected, photo.id] })
  }

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e) }
  }

  const src = photo.src || fileURL(photo.key)
  const isVideo = photo.type === 'video'

  return (
    <figure
      className="photo-card"
      role="button"
      tabIndex={0}
      aria-label={`Trashed photo ${photo.caption || photo.id}`}
      onClick={toggle}
      onKeyDown={onKey}
      style={{ borderColor: selected ? 'var(--accent)' : 'rgba(255,107,138,.35)', opacity: .85 }}
    >
      {isVideo ? (
        <video src={src} muted preload="metadata" />
      ) : (
        <img src={src} alt={photo.caption || 'Trashed memory'} loading="lazy" />
      )}

      <span className="photo-album-tag" style={{ color: 'var(--danger)' }}>
        ← {(photo.originalAlbum || photo.album || '').toUpperCase()}
      </span>

      <span
        className="dot"
        style={{
          position: 'absolute', top: 10, right: 10, width: 16, height: 16,
          background: selected ? 'var(--accent)' : 'transparent',
          border: selected ? 'none' : '2px solid var(--line)',
          boxShadow: selected ? '0 0 10px var(--accent)' : 'none',
        }}
      />

      <figcaption style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', color: '#fff', wordBreak: 'break-word' }}>
          {photo.caption || 'UNTITLED'}
        </div>
        <div className="photo-byline">
          {(photo.uploadedBy || '').toUpperCase()} {photo.size ? `• ${formatBytes(photo.size)}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button
            className="btn mini"
            style={{ flex: 1 }}
            onClick={(e) => { e.stopPropagation(); restorePhotos([photo.id]).catch((err) => toast(err.message || 'RESTORE FAILED')) }}
          >
            ↩ RESTORE
          </button>
          <button
            className="btn mini danger"
            onClick={(e) => { e.stopPropagation(); deletePhotoForever(photo.id).catch((err) => toast(err.message || 'DELETE FAILED')) }}
          >
            🗑 DELETE
          </button>
        </div>
      </figcaption>
    </figure>
  )
}
