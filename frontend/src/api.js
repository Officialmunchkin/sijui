// FAM VAULT talks to the Laravel API for everything that is application
// state — auth, members, albums, board, and the photo list/trash (the local
// `photos` table is the source of truth). Photo BYTES live in R2 behind the
// famvault-r2 Worker and are proxied by Laravel by default, so the browser
// only ever talks to our API and needs no Worker CORS. Set
// VITE_USE_WORKER_FILES=true to fetch bytes straight from the Worker instead.
// No R2/Worker secrets ever reach the browser — the Worker holds the keys.
//
// NOTE: the API base already includes the /api suffix, e.g.
//   https://famvault-backend.onrender.com/api
// Accepts VITE_API_BASE_URL (production) or VITE_API_BASE.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api').replace(/\/+$/, '')

// Public Cloudflare Worker in front of the R2 bucket (keys stay server-side).
// Only used when VITE_USE_WORKER_FILES is enabled.
// Accepts VITE_R2_BASE (production) or VITE_R2_WORKER.
const R2_BASE = (import.meta.env.VITE_R2_BASE || import.meta.env.VITE_R2_WORKER || 'https://famvault-r2.famvault.workers.dev').replace(/\/+$/, '')
const USE_WORKER_FILES = String(import.meta.env.VITE_USE_WORKER_FILES || '') === 'true'

let TOKEN = localStorage.getItem('famvault_token') || ''
export function setToken(t){ TOKEN = t || ''; if(t) localStorage.setItem('famvault_token', t); else localStorage.removeItem('famvault_token') }
export function getToken(){ return TOKEN }

function headers(json = false){
  const h = {}
  if(json) h['Content-Type'] = 'application/json'
  if(TOKEN) h['Authorization'] = 'Bearer ' + TOKEN
  return h
}

async function request(path, { method = 'GET', body, json = false, form = false } = {}){
  // For FormData the browser sets Content-Type (multipart boundary) itself —
  // setting it manually would corrupt the upload, so only send Authorization.
  const opts = { method, headers: form ? (TOKEN ? { 'Authorization': 'Bearer ' + TOKEN } : {}) : headers(json) }
  if(body !== undefined){
    if(form){ opts.body = body }            // FormData — browser sets boundary
    else { opts.body = JSON.stringify(body) }
  }
  const res = await fetch(API_BASE + path, opts)
  let data = null
  try { data = await res.json() } catch { /* non-JSON */ }
  if(!res.ok){
    const msg = (data && (data.error || data.message)) || ('REQUEST FAILED (' + res.status + ')')
    const err = new Error(msg); err.status = res.status; throw err
  }
  return data
}

/* ---------------------------------------------------------- AUTH */
export const apiLogin = (memberId, password) => request('/auth/login', { method:'POST', json:true, body:{ memberId, password } })
export const apiGuest = () => request('/auth/guest', { method:'POST' })
export const apiMe = () => request('/auth/me')
export const apiLogout = () => request('/auth/logout', { method:'POST' })

/* -------------------------------------------------------- MEMBERS */
export const apiMembers = () => request('/members')
export const apiCreateMember = (m) => request('/members', { method:'POST', json:true, body:m })
export const apiUpdateMember = (id, m) => request('/members/' + encodeURIComponent(id), { method:'PUT', json:true, body:m })
export const apiDeleteMember = (id) => request('/members/' + encodeURIComponent(id), { method:'DELETE' })
export const apiResetPassword = (id, password) => request('/members/' + encodeURIComponent(id) + '/password', { method:'POST', json:true, body:{ password } })
/* NOTE: GET /members/passwords was removed. Passwords are hashed server-side
   and there is no endpoint that can return one — not even for the admin. */

/* ------------------------------------------------------ PASSWORDS */
/* Member self-service: prove you know the old one, then set a new one.
   The server re-checks it against the bcrypt hash; nothing is ever echoed. */
export const apiChangePassword = (oldPassword, newPassword) =>
  request('/auth/change-password', { method:'POST', json:true, body:{ oldPassword, newPassword } })

/* Admin: the member table (id, name, role, hasPassword, createdAt) —
   never a password, never a hash. */
export const apiAdminUsers = () => request('/admin/users')

/* Admin: replace a member's password. The new value goes in and is hashed;
   what comes back is just { ok:true }. */
export const apiAdminResetPassword = (id, newPassword) =>
  request('/admin/users/' + encodeURIComponent(id) + '/reset-password', { method:'POST', json:true, body:{ newPassword } })

/* --------------------------------------------------------- ALBUMS */
export const apiAlbums = () => request('/albums')
export const apiCreateAlbum = (name) => request('/albums', { method:'POST', json:true, body:{ name } })
export const apiRenameAlbum = (name, newName) => request('/albums/' + encodeURIComponent(name), { method:'PUT', json:true, body:{ name: newName } })
export const apiDeleteAlbum = (name) => request('/albums/' + encodeURIComponent(name), { method:'DELETE' })

/* ---------------------------------------------------------- PHOTOS */
export const apiPhotos = (album) => request('/photos' + (album && album !== 'ALL' ? ('?album=' + encodeURIComponent(album)) : ''))
export const apiTrash = () => request('/photos/trash')
export const apiUploadPhoto = (formData) => request('/photos/upload', { method:'POST', form:true, body:formData })
export const apiTrashPhotos = (ids) => request('/photos/trash', { method:'POST', json:true, body:{ ids, action:'trash' } })
export const apiRestorePhotos = (ids) => request('/photos/trash', { method:'POST', json:true, body:{ ids, action:'restore' } })
export const apiMovePhotos = (ids, album) => request('/photos/move', { method:'POST', json:true, body:{ ids, album } })
export const apiDeletePhoto = (id) => request('/photos/' + encodeURIComponent(id), { method:'DELETE' })
export const apiEmptyTrash = () => request('/photos/trash/empty', { method:'DELETE' })

/* --------------------------------------------- SELECTIVE SHARING
   Change who can see one photo. Empty list = back to public (that is what
   "public" means server-side: no visibility rows). Uploader only. */
export const apiSetVisibility = (id, allowed_viewers) =>
  request('/photos/' + encodeURIComponent(id) + '/visibility', { method:'PUT', json:true, body:{ allowed_viewers } })

/* ------------------------------------------------- SECRET ALBUMS
   End-to-end encrypted. These endpoints only ever carry ciphertext, a name
   and a salt — the key is derived and held in the browser (see crypto.js)
   and is never sent. */
export const apiSecretAlbums = () => request('/secret-albums')
export const apiCreateSecretAlbum = (name, salt) =>
  request('/secret-albums/create', { method:'POST', json:true, body:{ name, salt } })
export const apiSecretMedia = (albumId) =>
  request('/secret-albums/' + encodeURIComponent(albumId) + '/media')
export const apiUploadSecretMedia = (formData) =>
  request('/secret-media/upload', { method:'POST', form:true, body:formData })
export const apiDeleteSecretMedia = (id) => request('/secret-media/' + encodeURIComponent(id), { method:'DELETE' })
export const apiDeleteSecretAlbum = (id) => request('/secret-albums/' + encodeURIComponent(id), { method:'DELETE' })

/* Fetch the CIPHERTEXT for one secret file. The bytes come back encrypted;
   decryptBytes() in the browser is what turns them into a picture. */
export async function apiFetchSecretBytes(id){
  const res = await fetch(API_BASE + '/secret-media/file/' + encodeURIComponent(id), {
    headers: TOKEN ? { 'Authorization':'Bearer ' + TOKEN } : {},
  })
  if(!res.ok) throw new Error(res.status === 403 ? 'NOT YOUR SECRET ALBUM' : 'FETCH FAILED')
  return await res.arrayBuffer()
}

/* Build a URL for a photo's bytes.
   Default: the Laravel proxy (/api/photos/file/<key>) so the browser only
   talks to our API and no Worker CORS is required. Opt-in: the R2 Worker's
   own /file/<key> endpoint (needs the Worker to allow CORS for downloads). */
export function fileURL(key){
  if(!key) return ''
  const enc = key.split('/').map(encodeURIComponent).join('/')
  return USE_WORKER_FILES
    ? R2_BASE + '/file/' + enc
    : API_BASE + '/photos/file/' + enc
}

/* Download a photo's bytes and save via a temporary anchor. */
export async function downloadPhoto(p){
  const url = p.src || fileURL(p.key)
  try{
    const res = await fetch(url, { headers: TOKEN ? { 'Authorization':'Bearer ' + TOKEN } : {} })
    if(!res.ok) throw new Error('DOWNLOAD FAILED')
    const blob = await res.blob()
    const a = document.createElement('a')
    const u = URL.createObjectURL(blob)
    a.href = u; a.download = p.fileName || (p.id + '.jpg')
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(u), 1000)
  }catch(e){
    window.open(url, '_blank')
  }
}

/* Fetch a photo's raw bytes (authenticated) — used to build album ZIPs. */
export async function fetchPhotoBytes(key){
  const res = await fetch(fileURL(key), { headers: TOKEN ? { 'Authorization':'Bearer ' + TOKEN } : {} })
  if(!res.ok) throw new Error('FETCH FAILED')
  return new Uint8Array(await res.arrayBuffer())
}

/* ---------------------------------------------------------- BOARD */
export const apiBoard = () => request('/board')
export const apiPostBoard = (text) => request('/board', { method:'POST', json:true, body:{ text } })
export const apiUpdateBoard = (id, text) => request('/board/' + id, { method:'PUT', json:true, body:{ text } })
export const apiDeleteBoard = (id) => request('/board/' + id, { method:'DELETE' })