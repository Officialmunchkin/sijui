import { useEffect, useState } from 'react'
import { useVault } from '../VaultContext'
import { fileURL, downloadPhoto } from '../api'
import { formatBytes } from '../utils'

export default function Lightbox() {
  const { state, set, isGuest, trashPhotos, toast, setPhotoVisibility } = useVault()
  const photo = state.lightbox

  // SELECTIVE SHARING — change your mind after the fact. Only the person who
  // uploaded it gets these controls; the server enforces the same rule, so
  // the admin cannot re-point someone else's photo either.
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const iUploaded = !!photo && !isGuest && photo.uploadedBy === state.me?.id
  const currentViewers = photo?.visibleTo || []

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

  /** Persist a new allow-list. Empty = back to All Family (public). */
  const saveViewers = async (ids) => {
    setSaving(true)
    try {
      await setPhotoVisibility(photo.id, ids)
      set({ lightbox: { ...photo, visibleTo: ids } })
      setPickerOpen(false)
      toast(ids.length ? `SHARED WITH ${ids.length} SELECTED` : 'BACK TO ALL FAMILY')
    } catch (e) {
      toast(e.message || 'COULD NOT UPDATE')
    } finally {
      setSaving(false)
    }
  }

  const toggleViewer = (id) =>
    saveViewers(currentViewers.includes(id) ? currentViewers.filter((v) => v !== id) : [...currentViewers, id])

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

          {/* ---- WHO CAN SEE (uploader only) ---- */}
          {iUploaded && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--dim)', fontWeight: 700 }}>WHO CAN SEE?</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn mini chip-album"
                    style={currentViewers.length === 0 ? { background: 'rgba(139,92,246,.25)', borderColor: 'var(--accent)', color: '#fff' } : undefined}
                    onClick={() => saveViewers([])}
                    disabled={saving}
                  >
                    👨‍👩‍👧 ALL FAMILY
                  </button>
                  <button
                    className="btn mini chip-album"
                    style={currentViewers.length > 0 || pickerOpen ? { background: 'rgba(139,92,246,.25)', borderColor: 'var(--accent)', color: '#fff' } : undefined}
                    onClick={() => setPickerOpen((v) => !v)}
                    aria-pressed={pickerOpen}
                  >
                    ☑ SELECT{currentViewers.length > 0 ? ` (${currentViewers.length})` : ''}
                  </button>
                </div>
              </div>

              {(pickerOpen || currentViewers.length > 0) && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {state.members.map((m) => {
                    const on = currentViewers.includes(m.id)
                    return (
                      <button
                        key={m.id}
                        className="btn mini chip-album"
                        style={{
                          flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6,
                          ...(on ? { background: 'rgba(139,92,246,.25)', borderColor: 'var(--accent)', color: '#fff' } : null),
                        }}
                        onClick={() => toggleViewer(m.id)}
                        disabled={saving}
                        aria-pressed={on}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 12, height: 12, borderRadius: 4, display: 'inline-grid', placeItems: 'center',
                            border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                            background: on ? 'var(--accent)' : 'transparent', fontSize: 8, color: '#fff',
                          }}
                        >
                          {on ? '✓' : ''}
                        </span>
                        {m.name}
                      </button>
                    )
                  })}
                </div>
              )}

              <div style={{ marginTop: 6, fontSize: 9, letterSpacing: '.1em', color: 'var(--dim)', lineHeight: 1.6 }}>
                {currentViewers.length > 0
                  ? 'VISIBLE TO THE PEOPLE TICKED ABOVE (AND YOU). EVERYONE ELSE — INCLUDING ADMIN — CANNOT SEE IT.'
                  : 'EVERY FAMILY MEMBER CAN SEE THIS.'}
              </div>
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
