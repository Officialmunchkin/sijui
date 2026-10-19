import { useVault } from './VaultContext'
import LoginScreen from './components/LoginScreen'
import Header from './components/Header'
import HomeTab from './components/HomeTab'
import AlbumsTab from './components/AlbumsTab'
import MembersTab from './components/MembersTab'
import BoardTab from './components/BoardTab'
import TrashTab from './components/TrashTab'
import AdminTab from './components/AdminTab'
import UploadModal from './components/UploadModal'
import Lightbox from './components/Lightbox'
import AddMemberModal from './components/AddMemberModal'
import EditMemberModal from './components/EditMemberModal'
import NewAlbumModal from './components/NewAlbumModal'
import RenameAlbumModal from './components/RenameAlbumModal'
import Toast from './components/Toast'

export default function App() {
  const { state, set, isGuest, isAdmin } = useVault()

  if (!state.booted) {
    return (
      <div className="login">
        <div className="login-inner">
          <div className="logo-big">FAM VAULT</div>
          <div className="login-sub">LOADING VAULT…</div>
        </div>
      </div>
    )
  }

  if (!state.me) return <LoginScreen />

  const tabs = ['HOME', 'ALBUMS', 'MEMBERS', 'BOARD']
  if (isAdmin) tabs.push('ADMIN')
  if (isAdmin) tabs.push('TRASH')

  return (
    <div className="app">
      {isGuest && (
        <div className="guest-bar">
          <div className="guest-bar-in">
            👁 GUEST VIEW ONLY — DOWNLOAD, UPLOAD &amp; EDIT DISABLED
          </div>
        </div>
      )}

      <Header tabs={tabs} />

      <div className="content">
        {state.tab === 'HOME' && <HomeTab />}
        {state.tab === 'ALBUMS' && <AlbumsTab />}
        {state.tab === 'MEMBERS' && <MembersTab />}
        {state.tab === 'BOARD' && <BoardTab />}
        {state.tab === 'ADMIN' && isAdmin && <AdminTab />}
        {state.tab === 'TRASH' && isAdmin && <TrashTab />}
      </div>

      {!isGuest && !state.selectMode && (
        <button
          className="fab"
          title="UPLOAD PHOTOS"
          aria-label="Upload photos"
          onClick={() => {
            const album = state.albumFilter !== 'ALL' ? state.albumFilter : (state.albums[0] || '')
            set({ uploadOpen: true, uploadAlbum: album })
          }}
        >
          +
        </button>
      )}

      {state.uploadOpen && <UploadModal />}
      {state.lightbox && <Lightbox />}
      {state.addMemberOpen && <AddMemberModal />}
      {state.editMemberId && <EditMemberModal />}
      {state.newAlbumOpen && <NewAlbumModal />}
      {state.renameAlbumId && <RenameAlbumModal />}
      <Toast msg={state.toast} />
    </div>
  )
}
