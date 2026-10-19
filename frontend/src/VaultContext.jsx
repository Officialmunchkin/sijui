import { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import * as api from './api'
import { colorFor, slugId, zipStore } from './utils'

const Ctx = createContext(null)
export const useVault = () => useContext(Ctx)

const TABS = ['HOME','ALBUMS','MEMBERS','BOARD','ADMIN','TRASH']

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
  // lightbox
  lightbox: null,
  // select / bulk
  selectMode: false, selected: [],
  // modals
  addMemberOpen: false, addMember: blankMember(),
  editMemberId: null, editMember: blankMember(),
  newAlbumOpen: false, newAlbumTitle: '',
  renameAlbumId: null, renameAlbumName: '',
  bioEditId: null, bioDraft: '',
  adminPwDrafts: {},
  adminPasswords: null,      // admin-only decrypted password list (lazy loaded)
  toast: null,
  visibleLimit: 100,
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
    set({ me:null, tab:'HOME', albumFilter:'ALL', search:'', selectMode:false, selected:[] })
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
        try { await api.apiUploadPhoto(fd) } catch (e) { /* keep going */ }
        done++; set({ uploadDone: done })
      }
    })
    await Promise.all(workers)
    set({ uploading: false, uploadOpen: false, uploadFiles: [], uploadCaption: '', uploadTagged: [], uploadNewAlbum: false, uploadNewAlbumName: '' })
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
  async function saveBio(){
    const id = state.bioEditId
    if(!id) return
    await api.apiUpdateMember(id, { bio: state.bioDraft })
    await loadMembersAlbums()
    set({ bioEditId:null, bioDraft:'' })
    toast('BIO SAVED')
  }

  // ---- admin: view passwords + download album as zip ----
  async function viewPasswords(){
    const r = await api.apiViewPasswords()
    set({ adminPasswords: r.passwords || [] })
  }
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
    viewPasswords, downloadAlbumZip,
    postBoard, editBoardPost, deleteBoardPost,
    filteredPhotos,
    blankMember,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}