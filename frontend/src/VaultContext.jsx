import { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import * as api from './api'
import * as crypto from './crypto'
import { colorFor, slugId, zipStore } from './utils'

const Ctx = createContext(null)
export const useVault = () => useContext(Ctx)

const TABS = ['HOME','ALBUMS','SECRET','MEMBERS','BOARD','ADMIN','TRASH']

const initial = {
  booted: false,
  me: null,                 // current member object (after login) or null
  pendingId: null,          // member id chosen on login screen, awaiting password
  pwInput: '', pwError: '',
  members: [],              // non-guest members from API
  albums: [],               // album name strings (no UNSORTED, TRASH reserved)
  photos: [],               // active (non-trashed) photos
  trash: [],                // trashed photos
  board: [],                // board posts
  tab: 'HOME',
  albumFilter: 'ALL',
  search: '',
  loading: false,
  // upload
  uploadOpen: false, uploadFiles: [], uploadCaption: '', uploadAlbum: null,
  uploadTagged: [], uploadNewAlbum: false, uploadNewAlbumName: '',
  uploading: false, uploadDone: 0, uploadTotal: 0,
  uploadViewers: [],        // SELECTIVE SHARING: member ids picked via "Select"
  uploadShareMode: 'all',   // 'all' = All Family (default), 'select' = narrowed
  // lightbox
  lightbox: null,
  // select / bulk
  selectMode: false, selected: [],
  // secret albums (E2EE — the key itself lives in crypto.js, never here)
  secretAlbums: [],
  secretAlbum: null,        // currently opened album, or null
  secretItems: [],          // DECRYPTED items for the open album
  secretBusy: false,
  secretError: '',
  // modals
  addMemberOpen: false, addMember: blankMember(),
  editMemberId: null, editMember: blankMember(),
  newAlbumOpen: false, newAlbumTitle: '',
  renameAlbumId: null, renameAlbumName: '',
  bioEditId: null, bioDraft: '',
  adminPwDrafts: {},
  resetPwId: null, resetPwDraft: '',   // admin RESET modal (set a new password)
  pwChange: { oldPassword:'', newPassword:'', confirm:'' },   // member's own
  toast: null,
  visibleLimit: 20,
}

function blankMember(){
  return { name:'', relation:'', birthday:'', bio:'', color:'#8B5CF6', isAdmin:false, isGuest:false }
}

function reducer(state, action){
  switch(action.type){
    case 'SET': return { ...state, ...action.p }
    case 'TOAST': return { ...state, toast: action.msg }
    default: return state
  }
}

export function VaultProvider({ children }){
  const [state, dispatch] = useReducer(reducer, initial)
  const set = (p) => dispatch({ type:'SET', p })
  const toastRef = useRef(null)
  const toast = (msg) => {
    dispatch({ type:'TOAST', msg })
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => dispatch({ type:'TOAST', msg:null }), 2600)
  }

  // ---- data loaders ----
  async function loadMembersAlbums(){
    const [m, a] = await Promise.all([api.apiMembers(), api.apiAlbums()])
    set({ members: m.members || [], albums: a.albums || [] })
  }
  async function loadPhotos(){
    const p = await api.apiPhotos()
    // Trash is admin-only now; non-admins get a 403 which we swallow to [].
    const t = await api.apiTrash().catch(() => ({ photos: [] }))
    set({ photos: p.photos || [], trash: t.photos || [] })
  }
  async function loadBoard(){
    const b = await api.apiBoard()
    set({ board: b.posts || [] })
  }

  // ---- boot ----
  useEffect(() => {
    (async () => {
      await loadMembersAlbums()
      if(api.getToken()){
        try{
          const me = await api.apiMe()
          set({ me: me.member, booted:true })
          await Promise.all([loadPhotos(), loadBoard()])
          return
        }catch(e){ api.setToken('') }
      }
      set({ booted:true })
    })()
  }, [])

  // ---- auth actions ----
  async function submitLogin(){
    const id = state.pendingId
    const pw = state.pwInput.trim()
    if(!pw){ set({ pwError:'ENTER PASSWORD • CANNOT BE EMPTY' }); return }
    try{
      const r = await api.apiLogin(id, pw)
      api.setToken(r.token)
      set({ me:r.member, pendingId:null, pwInput:'', pwError:'' })
      // Reload members too: a first login sets the password, so hasPassword
      // (and the admin SET counter) must reflect the fresh state.
      await Promise.all([loadPhotos(), loadBoard(), loadMembersAlbums()])
    }catch(e){
      set({ pwError: e.message || 'LOGIN FAILED' })
    }
  }
  async function continueAsGuest(){
    try{
      const r = await api.apiGuest()
      api.setToken(r.token)
      set({ me:r.member, pendingId:null, pwInput:'', pwError:'' })
      await loadPhotos()
    }catch(e){ toast('GUEST LOGIN FAILED') }
  }
  async function logout(){
    try{ await api.apiLogout() }catch{}
    api.setToken('')
    // Forget the decrypted secret-album key with the session. It was only
    // ever in memory; this drops the reference so the next login has to
    // re-enter the password.
    crypto.clearSecretKey()
    set({ me:null, tab:'HOME', albumFilter:'ALL', search:'', selectMode:false, selected:[],
          secretAlbum:null, secretItems:[], uploadViewers:[] })
  }

  // ---- album actions ----
  async function createAlbum(name){
    const nm = String(name||'').trim().toUpperCase()
    if(!nm) return false
    if(state.albums.includes(nm)){ toast('ALBUM ALREADY EXISTS'); return false }
    await api.apiCreateAlbum(nm)
    await loadMembersAlbums()
    set({ albumFilter:nm, uploadAlbum:nm, newAlbumOpen:false, newAlbumTitle:'' })
    return true
  }
  async function renameAlbum(oldName, name){
    const nm = String(name||'').trim().toUpperCase()
    if(!nm){ return }
    if(oldName !== nm && state.albums.includes(nm)){ toast('ALBUM ALREADY EXISTS'); return }
    await api.apiRenameAlbum(oldName, nm)
    await Promise.all([loadMembersAlbums(), loadPhotos()])
    set({ renameAlbumId:null, renameAlbumName:'', albumFilter: state.albumFilter === oldName ? nm : state.albumFilter })
  }
  async function deleteAlbum(name){
    const count = state.photos.filter(p => p.album === name).length
    if(!confirm(`DELETE ALBUM ${name}? ALL ${count} PHOTOS WILL GO TO TRASH`)) return
    await api.apiDeleteAlbum(name)
    await Promise.all([loadMembersAlbums(), loadPhotos()])
    if(state.albumFilter === name) set({ albumFilter:'ALL' })
    toast(`ALBUM ${name} DELETED • ${count} MOVED TO TRASH`)
  }

  // ---- photo actions ----
  async function startUpload(opts = {}) {
    const files = state.uploadFiles
    if (!files.length) return
    const album = opts.album || state.uploadAlbum || (state.albums[0] || '')
    const caption = opts.caption ?? state.uploadCaption
    const tagged = opts.tagged || state.uploadTagged
    set({ uploading: true, uploadDone: 0, uploadTotal: files.length })
    let done = 0
    // upload with concurrency 4
    const queue = [...files]
    const workers = Array.from({ length: Math.min(4, queue.length) }, async () => {
      while (queue.length) {
        const f = queue.shift()
        const fd = new FormData()
        fd.append('file', f)
        fd.append('caption', caption || 'NEW MEMORY')
        fd.append('album', album || (state.albums[0] || ''))
        fd.append('tagged', tagged.join(','))
        // SELECTIVE SHARING: "All Family" is the default and sends nothing,
        // which the server implements as "no visibility rows". Only an
        // explicit narrowed choice narrows the photo.
        if (state.uploadShareMode === 'select' && state.uploadViewers.length) {
          fd.append('allowed_viewers', state.uploadViewers.join(','))
        }
        try { await api.apiUploadPhoto(fd) } catch (e) { /* keep going */ }
        done++; set({ uploadDone: done })
      }
    })
    await Promise.all(workers)
    set({ uploading: false, uploadOpen: false, uploadFiles: [], uploadCaption: '', uploadTagged: [], uploadNewAlbum: false, uploadNewAlbumName: '', uploadViewers: [], uploadShareMode: 'all' })
    await loadPhotos()
    await loadMembersAlbums().catch(() => {})
    toast('UPLOAD COMPLETE')
  }
  async function trashPhotos(ids){
    if(!ids.length) return
    await api.apiTrashPhotos(ids)
    await loadPhotos()
  }
  async function restorePhotos(ids){
    if(!ids.length) return
    await api.apiRestorePhotos(ids)
    await loadPhotos()
  }
  async function movePhotos(ids, album){
    if(!ids.length || !album) return
    await api.apiMovePhotos(ids, album)
    await loadPhotos()
  }
  async function deletePhotoForever(id){
    await api.apiDeletePhoto(id)
    await loadPhotos()
    toast('PERMANENTLY DELETED')
  }
  async function emptyTrash(){
    const n = state.trash.length
    if(!n){ toast('TRASH IS EMPTY'); return }
    if(!confirm(`EMPTY TRASH? ${n} ${n === 1 ? 'ITEM' : 'ITEMS'} WILL BE PERMANENTLY DELETED.`)) return
    await api.apiEmptyTrash()
    await loadPhotos()
    toast('TRASH EMPTIED')
  }

  // ---- member actions ----
  async function saveNewMember(){
    const f = state.addMember
    if(!f.name.trim()){ toast('NAME REQUIRED'); return }
    const id = slugId(f.name)
    if(state.members.some(m => m.id === id)){ toast('MEMBER ALREADY EXISTS'); return }
    await api.apiCreateMember({ ...f, id, color: f.color || colorFor(id) })
    await loadMembersAlbums()
    set({ addMemberOpen:false, addMember:blankMember() })
    toast('MEMBER ADDED')
  }
  async function saveEditMember(){
    const f = state.editMember
    if(!f.name.trim()){ toast('NAME REQUIRED'); return }
    await api.apiUpdateMember(state.editMemberId, f)
    await loadMembersAlbums()
    set({ editMemberId:null, editMember:blankMember() })
    toast('MEMBER SAVED')
  }
  async function removeMember(id){
    if(!confirm('REMOVE THIS MEMBER?')) return
    try{ await api.apiDeleteMember(id); await loadMembersAlbums(); toast('MEMBER REMOVED') }
    catch(e){ toast(e.message || 'CANNOT REMOVE') }
  }
  async function adminSetPassword(id){
    const pw = (state.adminPwDrafts[id] || '').trim()
    if(!pw){ toast('ENTER A PASSWORD'); return }
    await api.apiResetPassword(id, pw)
    set({ adminPwDrafts: { ...state.adminPwDrafts, [id]: '' } })
    await loadMembersAlbums()   // refresh hasPassword flags so the counter updates
    toast('PASSWORD SET')
  }

  /**
   * ADMIN RESET — give a member a NEW password.
   *
   * There is no way to read the old one, and this never sends or receives
   * anything but the new value. The current password stays unknown to
   * everyone, including the admin.
   */
  async function adminResetPassword(){
    const id = state.resetPwId
    if(!id) return
    const pw = (state.resetPwDraft || '').trim()
    if(pw.length < 4){ toast('PASSWORD TOO SHORT — 4+'); return }
    const member = state.members.find(m => m.id === id)
    try{
      await api.apiAdminResetPassword(id, pw)
      set({ resetPwId:null, resetPwDraft:'' })
      await loadMembersAlbums()
      toast(`PASSWORD RESET FOR ${member ? member.name : id.toUpperCase()}`)
    }catch(e){ toast(e.message || 'RESET FAILED') }
  }

  /**
   * CHANGE MY PASSWORD — member self-service.
   *
   * Requires the current password; the server re-checks it against the
   * bcrypt hash. Changing it also revokes the member's other sessions.
   */
  async function changeMyPassword(){
    const { oldPassword, newPassword, confirm } = state.pwChange
    if(!oldPassword) return toast('ENTER YOUR CURRENT PASSWORD')
    if(newPassword.length < 4) return toast('NEW PASSWORD TOO SHORT — 4+')
    if(newPassword !== confirm) return toast('NEW PASSWORDS DO NOT MATCH')
    try{
      const r = await api.apiChangePassword(oldPassword, newPassword)
      set({ pwChange:{ oldPassword:'', newPassword:'', confirm:'' } })
      toast(`PASSWORD CHANGED${r && r.otherSessionsRevoked ? ` • ${r.otherSessionsRevoked} OTHER SESSION(S) SIGNED OUT` : ''}`)
    }catch(e){ toast(e.message || 'COULD NOT CHANGE PASSWORD') }
  }
  async function saveBio(){
    const id = state.bioEditId
    if(!id) return
    await api.apiUpdateMember(id, { bio: state.bioDraft })
    await loadMembersAlbums()
    set({ bioEditId:null, bioDraft:'' })
    toast('BIO SAVED')
  }

  // ---- admin: download album as zip ----
  async function downloadAlbumZip(album){
    const list = state.photos.filter(p => p.album === album)
    if(!list.length){ toast('NO PHOTOS IN ' + album); return }
    toast(`ZIPPING ${list.length} FILES…`)
    const files = []
    for(const p of list){
      try{
        const data = await api.fetchPhotoBytes(p.key)
        const fallbackExt = p.type === 'video' ? '.mp4' : '.jpg'
        const name = p.fileName || (p.id + fallbackExt)
        files.push({ name, data })
      }catch(e){ /* skip unreadable file */ }
    }
    if(!files.length){ toast('NO DOWNLOADABLE FILES'); return }
    const blob = zipStore(files)
    const a = document.createElement('a')
    const u = URL.createObjectURL(blob)
    a.href = u
    a.download = String(album).replace(/[^a-z0-9]+/gi, '_') + '.zip'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(u), 1000)
    toast(`DOWNLOADED ${album}.ZIP`)
  }

  // ---- board actions ----
  async function postBoard(text){
    if(!text.trim()) return
    await api.apiPostBoard(text)
    await loadBoard()
  }
  async function editBoardPost(id, text){
    const next = prompt('EDIT POST:', text)
    if(next && next.trim()){ await api.apiUpdateBoard(id, next); await loadBoard() }
  }
  async function deleteBoardPost(id){
    if(!confirm('DELETE THIS POST?')) return
    await api.apiDeleteBoard(id)
    await loadBoard()
  }

  // ---- SECRET ALBUMS (E2EE) ----
  // The password is turned into a key here in the browser and handed to
  // crypto.js, which keeps it in a module variable. It is never sent to the
  // server, never stored, and never logged.
  async function loadSecretAlbums(){
    const r = await api.apiSecretAlbums()
    set({ secretAlbums: r.albums || [] })
  }

  async function createSecretAlbum(name, password){
    const nm = String(name || '').trim()
    if(!nm) { toast('NAME REQUIRED'); return false }
    if(password.length < 4){ toast('PASSWORD TOO SHORT — 4+'); return false }

    const salt = crypto.randomSaltB64()
    // Derive BEFORE creating anything: if this throws, no half-made album.
    const key = await crypto.deriveKey(password, salt)
    await api.apiCreateSecretAlbum(nm, salt)
    await loadSecretAlbums()
    crypto.clearSecretKey()
    toast('SECRET ALBUM CREATED — LOCK IT WHEN YOU LEAVE')
    return true
  }

  /**
   * Open an album: re-derive the key from the password + the salt the server
   * gave back, then try to decrypt.
   *
   * There is no password verifier anywhere (that would be an offline guessing
   * target). The album's own contents answer the question instead: GCM's
   * auth tag fails on a wrong key, so the first decrypt throws and we know.
   * An album with nothing in it cannot answer — in that case any password
   * simply opens an empty album, which reveals nothing because there is
   * nothing to reveal.
   */
  async function openSecretAlbum(album, password){
    set({ secretBusy: true, secretError: '' })
    try{
      const key = await crypto.deriveKey(password, album.salt)
      const listing = await api.apiSecretMedia(album.id)

      if(listing.media && listing.media.length){
        try{
          await crypto.decryptFileName(key, listing.media[0].fileNameEncrypted)
        }catch{
          set({ secretBusy:false, secretError:'WRONG PASSWORD — NOTHING UNLOCKED' })
          return false
        }
      }

      crypto.setSecretKey(album.id, key)
      const items = await decryptAll(key, listing.media || [])
      set({ secretAlbum: album, secretItems: items, secretBusy:false, secretError:'' })
      return true
    }catch(e){
      set({ secretBusy:false, secretError: e.message || 'COULD NOT OPEN' })
      return false
    }
  }

  /** Pull the ciphertext for each item and turn it into a viewable blob URL. */
  async function decryptAll(key, media){
    const out = []
    for(const m of media){
      try{
        const ct = await api.apiFetchSecretBytes(m.id)
        const iv = crypto.b64ToBytes(m.iv)
        const pt = await crypto.decryptBytes(key, iv, ct)
        // The REAL mime type was recorded client-side before encryption, so
        // the browser renders <img> vs <video> correctly. The server's
        // "image/jpeg" is a lie (it is the .jpg key the Worker requires).
        const type = m.fileType || 'application/octet-stream'
        const name = await crypto.decryptFileName(key, m.fileNameEncrypted).catch(() => '')
        out.push({ id: m.id, url: URL.createObjectURL(new Blob([pt], { type })), type, name, size: m.size })
      }catch(e){
        // One unreadable item should not blank out the rest of the album.
        out.push({ id: m.id, url: null, type: '', name: '', size: m.size, unreadable: true })
      }
    }
    return out
  }

  /** Re-read the open album's listing and decrypt it again with the held
   *  key. Used after an upload so the new item appears without asking for
   *  the password a second time. */
  async function reloadSecretItems(album){
    const key = crypto.getSecretKey(album.id)
    if(!key) return
    const listing = await api.apiSecretMedia(album.id)
    set({ secretItems: await decryptAll(key, listing.media || []) })
    await loadSecretAlbums().catch(() => {})
  }

  /** Encrypt one file and upload the CIPHERTEXT. The server never decrypts. */
  async function uploadSecretFile(album, file){
    const key = crypto.getSecretKey(album.id)
    if(!key) throw new Error('ALBUM IS LOCKED')

    const buf = await file.arrayBuffer()
    const iv = crypto.randomIv()
    const ct = await crypto.encryptBytes(key, iv, buf)

    // The name the browser sends is generated, not the real one — a
    // plaintext file name must not reach the server or the Worker.
    const fd = new FormData()
    fd.append('file', new Blob([ct], { type:'application/octet-stream' }), 'secret.jpg')
    fd.append('albumId', album.id)
    fd.append('iv', crypto.bytesToB64(iv))
    fd.append('fileNameEncrypted', await crypto.encryptFileName(key, file.name))
    fd.append('fileType', file.type || 'application/octet-stream')

    await api.apiUploadSecretMedia(fd)
  }

  async function deleteSecretMedia(album, id){
    await api.apiDeleteSecretMedia(id)
    set({ secretItems: state.secretItems.filter(i => i.id !== id) })
  }

  async function deleteSecretAlbum(album){
    if(!confirm(`DELETE SECRET ALBUM "${album.name}" AND ITS ${(album.count || 0)} ENCRYPTED FILE(S)?\n\nTHEY CANNOT BE RECOVERED — THE SERVER CANNOT DECRYPT THEM.`)) return
    await api.apiDeleteSecretAlbum(album.id)
    crypto.clearSecretKey()
    set({ secretAlbum:null, secretItems:[] })
    await loadSecretAlbums()
    toast('SECRET ALBUM DELETED')
  }

  /** Lock = drop the in-memory key and close the album view. */
  function lockSecretAlbum(){
    crypto.clearSecretKey()
    set({ secretAlbum:null, secretItems:[], secretError:'' })
  }

  /** SELECTIVE SHARING: change who can see one photo after the fact. */
  async function setPhotoVisibility(photoId, viewers){
    const r = await api.apiSetVisibility(photoId, viewers)
    await loadPhotos()
    return r
  }

  // ---- selectors ----
  const id = state.me?.id || ''
  const isGuest = !!id && id.startsWith('guest_')
  const isAdmin = id === 'herman'
  const isMember = !!id && !isGuest && !isAdmin
  const isHerman = isAdmin
  const canSeeTrash = isAdmin

  function filteredPhotos(){
    let list = state.photos
    if(state.tab === 'ALBUMS' && state.albumFilter !== 'ALL') list = list.filter(p => p.album === state.albumFilter)
    if(state.search.trim()){
      const q = state.search.toLowerCase()
      list = list.filter(p => (p.caption||'').toLowerCase().includes(q) || (p.album||'').toLowerCase().includes(q))
    }
    return list
  }

  const value = {
    state, set, toast,
    TABS,
    isAdmin, isHerman, isGuest, isMember, canSeeTrash,
    loadMembersAlbums, loadPhotos, loadBoard,
    submitLogin, continueAsGuest, logout,
    createAlbum, renameAlbum, deleteAlbum,
    startUpload, trashPhotos, restorePhotos, movePhotos, deletePhotoForever, emptyTrash,
    saveNewMember, saveEditMember, removeMember, adminSetPassword, saveBio,
    adminResetPassword, changeMyPassword,
    loadSecretAlbums, createSecretAlbum, openSecretAlbum, uploadSecretFile,
    reloadSecretItems, deleteSecretMedia, deleteSecretAlbum, lockSecretAlbum,
    setPhotoVisibility,
    downloadAlbumZip,
    postBoard, editBoardPost, deleteBoardPost,
    filteredPhotos,
    blankMember,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}