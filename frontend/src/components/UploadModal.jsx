import { useRef } from 'react'
import { useVault } from '../VaultContext'
import { mb } from '../utils'

export default function UploadModal() {
  const {
    state, set, startUpload, createAlbum, toast,
  } = useVault()

  const fileRef = useRef(null)

  const close = () => {
    if (state.uploading) return
    set({ uploadOpen: false, uploadFiles: [], uploadCaption: '', uploadTagged: [], uploadNewAlbum: false, uploadNewAlbumName: '', uploadError: '', uploadViewers: [], uploadShareMode: 'all' })
  }

  const onFiles = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) set({ uploadFiles: [...state.uploadFiles, ...files] })
    e.target.value = ''
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.currentTarget.style.borderColor = 'var(--line)'
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length) set({ uploadFiles: [...state.uploadFiles, ...files] })
  }
  const onDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.style.borderColor = 'var(--accent)'
  }

  const removeFile = (i) => set({ uploadFiles: state.uploadFiles.filter((_, idx) => idx !== i) })

  const toggleTag = (id) =>
    set({
      uploadTagged: state.uploadTagged.includes(id)
        ? state.uploadTagged.filter((t) => t !== id)
        : [...state.uploadTagged, id],
    })

  // SELECTIVE SHARING. 'all' means "All Family", which the server implements
  // as "no visibility rows at all" — the default for every existing photo.
  const restricted = state.uploadShareMode === 'select'
  const toggleViewer = (id) =>
    set({
      uploadViewers: state.uploadViewers.includes(id)
        ? state.uploadViewers.filter((t) => t !== id)
        : [...state.uploadViewers, id],
    })

  // "MOM, DAD +1" — the first few names, then how many more are picked.
  const viewerLabel = () => {
    const names = state.uploadViewers
      .map((id) => (state.members.find((m) => m.id === id) || {}).name)
      .filter(Boolean)
    if (names.length <= 2) return names.join(', ')
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
  }

  const go = async () => {
    if (!state.uploadFiles.length) return toast('PICK AT LEAST ONE FILE')
    let album = state.uploadAlbum || (state.albums[0] || '')
    if (state.uploadNewAlbum) {
      const name = (state.uploadNewAlbumName || '').trim().toUpperCase()
      if (!name) return toast('ENTER ALBUM NAME')
      if (!state.albums.includes(name)) {
        const ok = await createAlbum(name).catch((e) => { toast(e.message || 'CREATE FAILED'); return false })
        if (ok === false) return
      }
      album = name
    }
    try {
      await startUpload({ album, caption: state.uploadCaption, tagged: state.uploadTagged })
    } catch (e) { toast(e.message || 'UPLOAD FAILED') }
  }

  const totalSize = state.uploadFiles.reduce((s, f) => s + f.size, 0)

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Upload photos">
      <div className="backdrop" onClick={close} />
      <div className="modal">
        <button className="x" onClick={close} aria-label="Close upload">✕</button>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.22em', color: '#fff' }}>
          📤 UPLOAD MEMORIES
        </div>
        <div style={{ marginTop: 4, fontSize: 9, letterSpacing: '.2em', color: 'var(--dim)' }}>
          JPG • PNG • GIF • WEBP • AVIF • MP4 • WEBM • MOV — MAX 200MB EACH
        </div>

        {/* file picker */}
        <div
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter') fileRef.current?.click() }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          role="button"
          tabIndex={0}
          style={{
            marginTop: 16, padding: '26px 14px', borderRadius: 16, border: '2px dashed var(--line)',
            background: 'var(--surface2)', textAlign: 'center', cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 24 }}>＋</div>
          <div style={{ marginTop: 6, fontSize: 10, letterSpacing: '.2em', color: 'var(--muted)' }}>
            TAP TO PICK PHOTOS / VIDEOS
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={onFiles} />
        </div>

        {state.uploadFiles.length > 0 && (
          <div style={{ marginTop: 12, maxHeight: 160, overflowY: 'auto', display: 'grid', gap: 6 }}>
            {state.uploadFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--line)' }}>
                <span style={{ flex: 1, fontSize: 10, letterSpacing: '.08em', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name}
                </span>
                <span style={{ fontSize: 9, color: 'var(--dim)' }}>{mb(f.size)} MB</span>
                <button className="btn mini danger" onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`}>✕</button>
              </div>
            ))}
            <div style={{ fontSize: 9, letterSpacing: '.16em', color: 'var(--dim)', textAlign: 'right' }}>
              {state.uploadFiles.length} FILES • {mb(totalSize)} MB TOTAL
            </div>
          </div>
        )}

        {/* album select */}
        <div style={{ marginTop: 14 }}>
          <div className="field-label">ALBUM</div>
          {state.uploadNewAlbum ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="NEW ALBUM NAME"
                value={state.uploadNewAlbumName}
                onChange={(e) => set({ uploadNewAlbumName: e.target.value })}
                autoFocus
              />
              <button className="btn mini" onClick={() => set({ uploadNewAlbum: false })}>← EXISTING</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                className="input"
                value={state.uploadAlbum || (state.albums[0] || '')}
                onChange={(e) => set({ uploadAlbum: e.target.value })}
              >
                {state.albums.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button className="btn mini" onClick={() => set({ uploadNewAlbum: true })}>+ NEW</button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------ WHO CAN SEE?
            Selective Sharing. "All Family" is the default and writes no
            visibility rows server-side, so every existing photo and every
            album/ZIP/download keeps working exactly as before. Picking
            specific members narrows the photo to them + the uploader. */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div className="field-label" style={{ margin: 0 }}>WHO CAN SEE?</div>
            {restricted && (
              <span style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--accent)', fontWeight: 700 }}>
                👁 {viewerLabel()}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              className="btn mini chip-album"
              style={!restricted ? { background: 'rgba(139,92,246,.25)', borderColor: 'var(--accent)', color: '#fff' } : undefined}
              onClick={() => set({ uploadShareMode: 'all', uploadViewers: [] })}
              aria-pressed={!restricted}
            >
              👨‍👩‍👧 ALL FAMILY
            </button>
            <button
              className="btn mini chip-album"
              style={restricted ? { background: 'rgba(139,92,246,.25)', borderColor: 'var(--accent)', color: '#fff' } : undefined}
              onClick={() => set({ uploadShareMode: 'select' })}
              aria-pressed={restricted}
            >
              ☑ SELECT
            </button>
          </div>

          {restricted && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {state.members.map((m) => {
                const on = state.uploadViewers.includes(m.id)
                return (
                  <button
                    key={m.id}
                    className="btn mini chip-album"
                    style={{
                      flex: '0 0 auto',
                      display: 'flex', alignItems: 'center', gap: 6,
                      ...(on ? { background: 'rgba(139,92,246,.25)', borderColor: 'var(--accent)', color: '#fff' } : null),
                    }}
                    onClick={() => toggleViewer(m.id)}
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
            {restricted
              ? 'ONLY THE PEOPLE YOU TICK — PLUS YOU — WILL SEE THESE. NOBODY ELSE, NOT EVEN ADMIN.'
              : 'EVERY FAMILY MEMBER CAN SEE THESE. CHOOSE SELECT TO KEEP THEM TO A FEW PEOPLE.'}
          </div>
        </div>

        {/* caption */}
        <div style={{ marginTop: 14 }}>
          <div className="field-label">CAPTION (OPTIONAL)</div>          <input
            className="input"
            placeholder="E.G. CHRISTMAS 2024"
            maxLength={300}
            value={state.uploadCaption}
            onChange={(e) => set({ uploadCaption: e.target.value })}
          />
        </div>

        {/* tagged members */}
        <div style={{ marginTop: 14 }}>
          <div className="field-label">TAG PEOPLE</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {state.members.map((m) => {
              const on = state.uploadTagged.includes(m.id)
              return (
                <button
                  key={m.id}
                  className="btn mini chip-album"
                  style={on ? { background: 'rgba(139,92,246,.25)', borderColor: 'var(--accent)', color: '#fff' } : undefined}
                  onClick={() => toggleTag(m.id)}
                  aria-pressed={on}
                >
                  {m.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* progress */}
        {state.uploading && (
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--surface2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${state.uploadTotal ? (state.uploadDone / state.uploadTotal) * 100 : 0}%`, background: 'linear-gradient(90deg,var(--accent2),var(--accent))', transition: 'width .2s' }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 9, letterSpacing: '.2em', color: 'var(--muted)', textAlign: 'center' }}>
              UPLOADING {state.uploadDone}/{state.uploadTotal}…
            </div>
          </div>
        )}

        {state.uploadError && <div className="err-box">{state.uploadError}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn" onClick={close} disabled={state.uploading}>CANCEL</button>
          <button className="btn primary" style={{ flex: 1 }} onClick={go} disabled={state.uploading || !state.uploadFiles.length}>
            {state.uploading ? 'UPLOADING…' : `UPLOAD ${state.uploadFiles.length || ''} →`}
          </button>
        </div>
      </div>
    </div>
  )
}
