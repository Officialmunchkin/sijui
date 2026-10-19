import { fileURL } from '../api'
import { formatBytes } from '../utils'
import { useVault } from '../VaultContext'

export default function PhotoCard({ photo }) {
  const { state, set, isGuest, toast } = useVault()

  const selected = state.selected.includes(photo.id)

  const activate = () => {
    if (state.selectMode) {
      if (isGuest) return toast('GUESTS CANNOT SELECT')
      set({
        selected: selected
          ? state.selected.filter((id) => id !== photo.id)
          : [...state.selected, photo.id],
      })
    } else {
      set({ lightbox: photo })
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() }
    if (e.key === 'Escape' && state.selectMode) set({ selectMode: false, selected: [] })
  }

  const src = photo.src || fileURL(photo.key)
  const isVideo = photo.type === 'video'

  return (
    <figure
      className="photo-card"
      role="button"
      tabIndex={0}
      aria-label={`Open photo ${photo.caption || photo.id}`}
      onClick={activate}
      onKeyDown={onKey}
      style={state.selectMode ? { borderColor: selected ? 'var(--accent)' : 'var(--line)', boxShadow: selected ? '0 0 20px rgba(139,92,246,.5)' : 'none' } : undefined}
    >
      {isVideo ? (
        <video src={src} muted preload="metadata" />
      ) : (
        <img src={src} alt={photo.caption || 'Family memory'} loading="lazy" />
      )}

      <span className="photo-album-tag">{photo.album}</span>
      <span className="photo-like">♥️ {photo.likes || 0}</span>

      {state.selectMode && (
        <span
          className="dot"
          style={{
            position: 'absolute', bottom: 10, right: 10, width: 16, height: 16,
            background: selected ? 'var(--accent)' : 'transparent',
            border: selected ? 'none' : '2px solid var(--line)',
            boxShadow: selected ? '0 0 10px var(--accent)' : 'none',
          }}
        />
      )}

      <figcaption style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', color: '#fff', wordBreak: 'break-word' }}>
          {photo.caption || 'UNTITLED'}
        </div>
        <div className="photo-byline">
          {(photo.uploadedBy || '').toUpperCase()} • {photo.date || ''} {photo.size ? `• ${formatBytes(photo.size)}` : ''}
        </div>
      </figcaption>
    </figure>
  )
}
