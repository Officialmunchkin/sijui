// Frontend talks ONLY to the Laravel API. No R2/Worker secrets ever reach
// the browser — the backend proxies file bytes through the Worker.
const BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000') + '/api'

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
  const res = await fetch(BASE + path, opts)
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
/* Admin-only: view every member's (decrypted) password. */
export const apiViewPasswords = () => request('/members/passwords')

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

/* Build a same-origin URL for a photo's bytes (backend proxies the Worker). */
export function fileURL(key){
  if(!key) return ''
  const enc = key.split('/').map(encodeURIComponent).join('/')
  return BASE + '/photos/file/' + enc
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