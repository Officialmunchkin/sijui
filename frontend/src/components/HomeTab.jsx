import { useVault } from "../VaultContext";
import PhotoCard from "./PhotoCard";

export default function HomeTab() {
  const v = useVault();
  const {
    photos, albums, albumFilter, setAlbumFilter, search, canModerate,
    visibleCount, setVisibleCount, selectMode, selected, setSelected, toast,
  } = v;

  const q = search.trim().toUpperCase();
  let list = photos;
  if (albumFilter !== "ALL") list = list.filter((p) => (p.album || "UNSORTED") === albumFilter);
  if (q) {
    list = list.filter(
      (p) =>
        (p.caption || "").toUpperCase().includes(q) ||
        (p.album || "").toUpperCase().includes(q) ||
        (p.uploadedBy || "").toUpperCase().includes(q)
    );
  }

  const shown = list.slice(0, visibleCount);
  const filterChips = ["ALL", ...albums.filter((a) => a !== "TRASH")];

  function toggle(id) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function bulkTrash() {
    const ids = Object.keys(selected).filter((id) => selected[id]);
    if (!ids.length) return toast("NOTHING SELECTED");
    if (!window.confirm(`MOVE ${ids.length} PHOTOS TO TRASH?`)) return;
    await v.trashPhotos(ids);
    setSelected({});
    v.setSelectMode(false);
  }

  return (
    <div>
      <div className="album-grid" style={{ marginBottom: 18 }}>
        {filterChips.map((a) => (
          <button
            key={a}
            className={`btn chip-album ${albumFilter === a ? "primary" : ""}`}
            onClick={() => setAlbumFilter(a)}
            style={{ height: 34 }}
          >
            {a}{" "}
            <span style={{ opacity: 0.6 }}>
              ({a === "ALL" ? photos.length : photos.filter((p) => (p.album || "UNSORTED") === a).length})
            </span>
          </button>
        ))}
      </div>

      {selectMode && (
        <div
          className="card"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
        >
          <span style={{ fontSize: 10, letterSpacing: ".18em", color: "var(--muted)" }}>
            SELECT MODE — {Object.values(selected).filter(Boolean).length} SELECTED
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {canModerate && (
              <button className="btn danger mini" onClick={bulkTrash}>
                MOVE TO TRASH
              </button>
            )}
            <button
              className="btn mini"
              onClick={() =>
                setSelected(Object.fromEntries(shown.map((p) => [p.id, true])))
              }
            >
              SELECT ALL
            </button>
            <button className="btn mini" onClick={() => setSelected({})}>
              CLEAR
            </button>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="empty">NO PHOTOS YET — HIT + TO UPLOAD</div>
      ) : (
        <div className="masonry">
          {shown.map((p) => (
            <PhotoCard key={p.id} photo={p} selectMode={selectMode} selected={!!selected[p.id]} onToggle={() => toggle(p.id)} />
          ))}
        </div>
      )}

      {list.length > visibleCount && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button className="btn" onClick={() => setVisibleCount((n) => n + 100)}>
            SHOW MORE ({list.length - visibleCount} LEFT)
          </button>
        </div>
      )}
    </div>
  );
}
