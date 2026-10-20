import { useEffect, useRef, useState } from 'react'
import { useVault } from '../VaultContext'
import { mb } from '../utils'

/**
 * SECRET — end-to-end encrypted albums.
 *
 * The server stores ciphertext, an album name and a salt. It cannot see the
 * photos, cannot see the file names, and cannot recover anything if the
 * password is lost. Neither can the admin, and that is the point: this is
 * the one part of the vault the operator is locked out of.
 *
 * Because there is no server-side verifier, "is this the right password?"
 * is answered by trying to decrypt — AES-GCM's auth tag rejects a wrong key
 * silently and cheaply. Losing the password therefore means losing the
 * photos, permanently. That is not a bug to be fixed later; it is what
 * end-to-end encryption means. The create dialog says so before anything is
 * written, and asks the member to write the password down.
 *
 * The derived key lives in crypto.js as a module variable and nowhere else —
 * not localStorage, not sessionStorage, not a cookie. Closing the tab or
 * logging out forgets it, so reopening asks again.
 */
export default function SecretAlbumTab() {
  const {
    state, set, toast,
    loadSecretAlbums, createSecretAlbum, openSecretAlbum,
    uploadSecretFile, reloadSecretItems, deleteSecretMedia, deleteSecretAlbum, lockSecretAlbum,
  } = useVault()

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPw, setNewPw] = useState('')
  const [warningOk, setWarningOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [unlockId, setUnlockId] = useState(null)
  const [unlockPw, setUnlockPw] = useState('')
  const uploadRef = useRef(null)

  useEffect(() => {
    loadSecretAlbums().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const album = state.secretAlbum

  /* ------------------------------------------------------------- CREATE */
  const submitCreate = async () => {
    setBusy(true)
    try {
      const ok = await createSecretAlbum(newName, newPw)
      if (ok) { setCreating(false); setWarningOk(false); setNewName(''); setNewPw('') }
    } catch (e) {
      toast(e.message || 'COULD NOT CREATE')
    } finally {
      setBusy(false)
    }
  }

  /* -------------------------------------------------------------- OPEN */
  const submitUnlock = async (a, password) => {
    const ok = await openSecretAlbum(a, password)
    if (ok) { setUnlockId(null); setUnlockPw('') }
  }

  /* ------------------------------------------------------------ UPLOAD */
  const onSecretFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length || !album) return
    setBusy(true)
    let done = 0
    for (const f of files) {
      try {
        await uploadSecretFile(album, f)
        done++
      } catch (err) {
        // Sizes and errors only — the file name is encrypted, so there is
        // nothing readable to report even here.
        toast(err.message || 'COULD NOT ENCRYPT + UPLOAD')
      }
    }
    setBusy(false)
    if (done) {
      await reloadSecretItems(album)
      toast(`ENCRYPTED + UPLOADED ${done}`)
    }
  }

  /* ------------------------------------------------------------- RENDER */
  if (album) {
    const items = state.secretItems
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>🔒</span>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.25em', color: '#fff' }}>{album.name}</span>
            <span style={{ fontSize: 9, letterSpacing: '.18em', color: 'var(--dim)' }}>END-TO-END ENCRYPTED</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn mini primary" onClick={() => uploadRef.current?.click()} disabled={busy}>
              {busy ? 'ENCRYPTING…' : '+ ADD ENCRYPTED'}
            </button>
            <button className="btn mini" onClick={lockSecretAlbum}>🔒 LOCK</button>
            <button className="btn mini danger" onClick={() => deleteSecretAlbum(album)}>DELETE</button>
          </div>
        </div>

        <input ref={uploadRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={onSecretFiles} />

        <div style={{ marginTop: 8, fontSize: 9, letterSpacing: '.14em', color: 'var(--dim)' }}>
          FILES ARE ENCRYPTED IN THIS BROWSER BEFORE THEY LEAVE IT — THE SERVER ONLY EVER HOLDS CIPHERTEXT.
        </div>

        {items.length === 0 ? (
          <div className="empty" style={{ marginTop: 40 }}>
            🔒 NOTHING IN HERE YET
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--dim)', letterSpacing: '.1em' }}>
              ADD A PHOTO OR VIDEO — IT GETS ENCRYPTED BEFORE UPLOAD.
            </div>
          </div>
        ) : (
          <div className="masonry" style={{ marginTop: 14 }}>
            {items.map((it) => (
              <figure key={it.id} className="photo-card">
                {it.unreadable || !it.url ? (
                  <div style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', background: 'var(--surface2)', color: 'var(--dim)', fontSize: 20 }}>
                    🔒
                  </div>
                ) : it.type.startsWith('video') ? (
                  <video src={it.url} controls playsInline style={{ width: '100%', display: 'block' }} />
                ) : (
                  <img src={it.url} alt={it.name || 'Secret memory'} loading="lazy" style={{ width: '100%', display: 'block' }} />
                )}
                <figcaption style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 9, color: 'var(--dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    🔒 {it.name || 'ENCRYPTED'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: 'var(--dim)' }}>{mb(it.size)} MB</span>
                    <button className="btn mini danger" onClick={() => deleteSecretMedia(album, it.id)} aria-label="Delete">✕</button>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12 }}>🔒</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.25em', color: '#fff' }}>SECRET ALBUMS</span>
          <span style={{ color: 'var(--dim)' }}>({state.secretAlbums.length})</span>
        </div>
        <button className="btn mini primary" onClick={() => setCreating(true)}>+ CREATE SECRET ALBUM</button>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, letterSpacing: '.12em', color: 'var(--dim)', lineHeight: 1.7 }}>
        ENCRYPTED BEFORE THEY LEAVE THIS DEVICE. NOT EVEN THE ADMIN CAN OPEN THESE.
      </div>

      {state.secretAlbums.length === 0 ? (
        <div className="empty" style={{ marginTop: 44 }}>
          🔒 NO SECRET ALBUMS YET
          <div style={{ marginTop: 10, fontSize: 10, color: 'var(--dim)', letterSpacing: '.1em', maxWidth: 460, lineHeight: 1.8 }}>
            THESE ARE FOR PHOTOS YOU DO NOT WANT ANYONE ELSE — NOT FAMILY, NOT ADMIN, NOT THE SERVER.
            YOU PICK A PASSWORD THAT NEVER LEAVES THIS BROWSER.
          </div>
        </div>
      ) : (
        <div className="members-grid" style={{ marginTop: 14 }}>
          {state.secretAlbums.map((a) => (
            <div key={a.id} className="card">
              {unlockId === a.id ? (
                <>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.2em', color: '#fff' }}>🔓 ENTER PASSWORD</div>
                  <input
                    className="input"
                    type="password"
                    placeholder="SECRET PASSWORD"
                    value={unlockPw}
                    onChange={(e) => setUnlockPw(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && unlockPw) submitUnlock(a, unlockPw) }}
                    autoFocus
                    style={{ marginTop: 10 }}
                  />
                  {state.secretError && <div className="err-box" style={{ marginTop: 8 }}>{state.secretError}</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button className="btn mini primary" onClick={() => submitUnlock(a, unlockPw)} disabled={!unlockPw || state.secretBusy}>
                      {state.secretBusy ? 'CHECKING…' : 'UNLOCK'}
                    </button>
                    <button className="btn mini" onClick={() => { setUnlockId(null); setUnlockPw('') }}>CANCEL</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center',
                      background: 'rgba(139,92,246,.16)', border: '1px solid rgba(139,92,246,.35)', fontSize: 16,
                    }}>
                      🔒
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.name}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 9, letterSpacing: '.14em', color: 'var(--dim)' }}>
                        {a.count || 0} ENCRYPTED • {mb(a.size || 0)} MB
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                    <button className="btn mini primary" style={{ flex: 1 }} onClick={() => { setUnlockId(a.id); setUnlockPw('') }}>
                      🔓 UNLOCK
                    </button>
                    <button className="btn mini danger" onClick={() => deleteSecretAlbum(a)}>✕</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------- CREATE MODAL */}
      {creating && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Create secret album">
          <div className="backdrop" onClick={() => !busy && setCreating(false)} />
          <div className="modal">
            <button className="x" onClick={() => setCreating(false)} aria-label="Close">✕</button>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.22em', color: '#fff' }}>🔒 CREATE SECRET ALBUM</div>

            <div style={{ marginTop: 14 }}>
              <div className="field-label">NAME</div>
              <input
                className="input"
                placeholder="E.G. PRIVATE"
                maxLength={60}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={warningOk}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="field-label">SECRET PASSWORD (NOT YOUR LOGIN PASSWORD)</div>
              <input
                className="input"
                type="password"
                placeholder="CHOOSE A PASSWORD"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                disabled={warningOk}
              />
              <div style={{ marginTop: 6, fontSize: 9, letterSpacing: '.1em', color: 'var(--dim)', lineHeight: 1.7 }}>
                THIS IS SEPARATE FROM THE ONE YOU LOG IN WITH. STRETCH IT OUT — LONGER IS MUCH SAFER.
              </div>
            </div>

            {!warningOk ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn" onClick={() => setCreating(false)}>CANCEL</button>
                <button
                  className="btn primary"
                  style={{ flex: 1 }}
                  disabled={!newName.trim() || newPw.length < 4}
                  onClick={() => setWarningOk(true)}
                >
                  CONTINUE →
                </button>
              </div>
            ) : (
              <>
                <div className="err-box" style={{ marginTop: 16, lineHeight: 1.8 }}>
                  <div style={{ fontWeight: 800, letterSpacing: '.14em' }}>⚠ READ THIS FIRST</div>
                  <div style={{ marginTop: 8, letterSpacing: '.06em', fontWeight: 400 }}>
                    IF YOU FORGET THIS PASSWORD, YOUR PHOTOS ARE GONE FOREVER.
                  </div>
                  <div style={{ marginTop: 8, letterSpacing: '.06em', fontWeight: 400 }}>
                    NOT EVEN THE ADMIN CAN RECOVER THEM. THERE IS NO RESET LINK AND NO BACK DOOR —
                    NOBODY ON EARTH CAN OPEN THESE FILES WITHOUT THE PASSWORD.
                  </div>
                  <div style={{ marginTop: 8, letterSpacing: '.06em', fontWeight: 400 }}>
                    WRITE IT DOWN AND KEEP IT SOMEWHERE SAFE.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn" onClick={() => setWarningOk(false)}>← BACK</button>
                  <button className="btn primary" style={{ flex: 1 }} onClick={submitCreate} disabled={busy}>
                    {busy ? 'CREATING…' : 'I UNDERSTAND — CREATE'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
