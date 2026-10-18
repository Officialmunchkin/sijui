import { useVault } from "../VaultContext";

export default function AlbumsTab() {
  const v = useVault();
  const { albums, photos, canModerate, setNewAlbumOpen, setAlbumFilter, setTab } = v;

  const SYSTEM = ["UNSORTED", "TRASH"];

  function openAlbum(a) {
    v.setAlbumFilter(a);
    v.setTab("HOME");
  }

  function coverFor(a) {
    return photos.find((p) => (p.album || "UNSORTED") === a);
  }

  async function rename(a) {
    const next = window.prompt(`RENAME ALBUM "${a}" TO:`, a);
    if (next == null) return;
    const res = await v.renameAlbum(a, next);
    if (!res.ok) v.toast(res.error || "RENAME FAILED");
  }

  async function remove(a) {
    const count = photos.filter((p) => (p.album || "UNSORTED") === a).length;
    if (!window.confirm(`DELETE ALBUM "${a}"? ${count} PHOTOS MOVE TO UNSORTED.`)) return;
    const res = await v.deleteAlbum(a);
    if (!res.ok) v.toast(res.error || "DELETE FAILED");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".18em", color: "#fff" }}>
          ALBUMS ({albums.length})
        </div>
        {canModerate && (
          <button className="btn primary mini" onClick={() => setNewAlbumOpen(true)}>
            + NEW ALBUM
          </button>
        )}
      </div>

      <div className="album-grid">
        {albums.map((a) => {
          const cover = coverFor(a);
          const count = photos.filter((p) => (p.album || "UNSORTED") === a).length;
          const isSystem = SYSTEM.includes(a);
          return (
            <div key={a} className="card album-card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                onClick={() => openAlbum(a)}
                style={{ cursor: "pointer", height: 130, background: "var(--surface2)", position: "relative" }}
              >
                {cover ? (
                  <img
                    src={cover.src}
                    alt={a}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dim)", fontSize: 30 }}>
                    ▣
                  </div>
                )}
                <span className="photo-album-tag">{count} PHOTOS</span>
              </div>

              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".14em", color: "#fff" }}>{a}</div>
                {isSystem && (
                  <div style={{ fontSize: 9, letterSpacing: ".16em", color: "var(--dim)", marginTop: 4 }}>
                    SYSTEM ALBUM
                  </div>
                )}
                {canModerate && !isSystem && (
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    <button className="btn mini" onClick={() => rename(a)}>RENAME</button>
                    <button className="btn danger mini" onClick={() => remove(a)}>DELETE</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
