import { useVault } from "../VaultContext";

export default function TrashTab() {
  const v = useVault();
  const { trash } = v;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".18em", color: "var(--danger)" }}>
          TRASH ({trash.length})
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn mini" onClick={v.restoreAll} disabled={!trash.length}>
            RESTORE ALL
          </button>
          <button className="btn danger mini" onClick={v.emptyTrash} disabled={!trash.length}>
            EMPTY TRASH
          </button>
        </div>
      </div>

      {trash.length === 0 ? (
        <div className="empty">TRASH IS EMPTY</div>
      ) : (
        <div className="masonry">
          {trash.map((p) => (
            <div key={p.id} className="photo-card" style={{ cursor: "default" }}>
              {p.type === "video" ? (
                <video src={p.src} muted playsInline preload="metadata" />
              ) : (
                <img src={p.src} alt={p.caption || ""} loading="lazy" />
              )}
              <span className="photo-album-tag">{p.originalAlbum || p.album || "UNSORTED"}</span>
              <div style={{ padding: "8px 10px" }}>
                {p.caption && <div style={{ fontSize: 11, color: "var(--txt)" }}>{p.caption}</div>}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button className="btn mini" onClick={() => v.restorePhoto(p.id)}>RESTORE</button>
                  <button className="btn danger mini" onClick={() => v.deleteForever(p.id)}>DELETE</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
