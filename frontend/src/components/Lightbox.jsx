import { useEffect } from 'react'
import { useVault } from '../VaultContext'
import { fileURL, downloadPhoto } from '../api'
import { formatBytes } from '../utils'

export default function Lightbox() {
  const { state, set, isGuest, trashPhotos, toast } = useVault()
  const photo = state.lightbox

  const close = () => set({ lightbox: null })

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!photo) return null
  const src = photo.src || fileURL(photo.key)
  const isVideo = photo.type === 'video'

  const doTrash = async () => {
    if (!confirm('MOVE THIS PHOTO TO TRASH?')) return
    try {
      await trashPhotos([photo.id])
      close()
      toast('MOVED TO TRASH')
    } catch (e) { toast(e.message || 'TRASH FAILED') }
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div className="backdrop" onClick={close} />
      <div className="lb-panel">
        <button className="x" style={{ zIndex: 2 }} onClick={close} aria-label="Close viewer">✕</button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05050C', minHeight: 240 }}>
          {isVideo ? (
            <video src={src} controls autoPlay style={{ maxWidth: '100%', maxHeight: '70vh' }} />
          ) : (
            <img src={src} alt={photo.caption || 'Family memory'} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
          )}
        </div>

        <div style={{ padding: 18, borderTop: '1px solid var(--line)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.16em', color: '#fff', wordBreak: 'break-word' }}>
            {photo.caption || 'UNTITLED'}
          </div>
          <div style={{ marginTop: 6, fontSize: 10, letterSpacing: '.16em', color: 'var(--dim)' }}>
            {(photo.uploadedBy || '').toUpperCase()} • {photo.album} • {photo.date || ''} {photo.size ? `• ${formatBytes(photo.size)}` : ''}
          </div>

          {Array.isArray(photo.tagged) && photo.tagged.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {photo.tagged.map((t) => (
                <span key={t} className="tag guest">@{String(t).toUpperCase()}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {!isGuest && (
              <button className="btn" onClick={() => downloadPhoto(photo).catch(() => toast('DOWNLOAD FAILED'))}>
                ⬇ DOWNLOAD
              </button>
            )}
            {!isGuest && (
              <button className="btn danger" onClick={doTrash}>
                🗑 MOVE TO TRASH
              </button>
            )}
            {isGuest && (
              <span style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--dim)' }}>
                GUESTS CANNOT DOWNLOAD OR EDIT
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
