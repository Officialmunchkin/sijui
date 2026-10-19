import { useVault } from '../VaultContext'
import TrashCard from './TrashCard'

export default function TrashTab() {
  const { state, set, restorePhotos, deletePhotoForever, emptyTrash, toast } = useVault()

  const selected = state.selected

  const restoreSelected = async () => {
    if (!selected.length) return
    try {
      await restorePhotos(selected)
      set({ selected: [] })
      toast('RESTORED')
    } catch (e) { toast(e.message || 'RESTORE FAILED') }
  }

  const deleteSelected = async () => {
    if (!selected.length) return
    if (!confirm(`PERMANENTLY DELETE ${selected.length} PHOTOS? THIS CANNOT BE UNDONE.`)) return
    try {
      for (const id of [...selected]) await deletePhotoForever(id)
      set({ selected: [] })
    } catch (e) { toast(e.message || 'DELETE FAILED') }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.25em', color: 'var(--danger)' }}>
          TRASH <span style={{ color: 'var(--dim)' }}>({state.trash.length})</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {selected.length > 0 && (
            <>
              <button className="btn mini" onClick={restoreSelected}>↩ RESTORE SELECTED ({selected.length})</button>
              <button className="btn mini danger" onClick={deleteSelected}>🗑 DELETE SELECTED</button>
            </>
          )}
          {state.trash.length > 0 && (
            <button className="btn mini danger" onClick={() => emptyTrash().catch((e) => toast(e.message || 'EMPTY FAILED'))}>
              🗑 EMPTY TRASH
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 9, letterSpacing: '.18em', color: 'var(--dim)' }}>
        RESTORE SENDS PHOTOS BACK TO THEIR ORIGINAL ALBUM (OR THE FIRST ALBUM IF IT WAS DELETED). PERMANENT DELETE PURGES THE FILE FROM STORAGE.
      </div>

      <div className="masonry" style={{ marginTop: 16 }}>
        {state.trash.length ? (
          state.trash.map((p) => <TrashCard key={p.id} photo={p} />)
        ) : (
          <div className="empty">TRASH IS EMPTY</div>
        )}
      </div>
    </>
  )
}
