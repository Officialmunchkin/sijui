import { useVault } from "../VaultContext";

export default function PhotoCard({ photo, selectMode, selected, onToggle }) {
  const v = useVault();
  const p = photo;

  function open() {
    if (selectMode) return onToggle();
    v.setLightbox(p);
  }

  return (
    <div
      className="photo-card"
      onClick={open}
      style={selected ? { borderColor: "var(--accent)", boxShadow: "0 0 22px rgba(139,92,246,.5)" } : undefined}
    >
      {p.type === "video" ? (
        <video src={p.src} muted playsInline preload="metadata" />
      ) : (
        <img src={p.src} alt={p.caption || ""} loading="lazy" />
      )}

      <span className="photo-album-tag">{p.album || "UNSORTED"}</span>
      {p.likes > 0 && <span className="photo-like">♥ {p.likes}</span>}
      {selectMode && (
        <span
          style={{
            position: "absolute", bottom: 10, right: 10, width: 24, height: 24,
            borderRadius: "50%", border: "2px solid #fff",
            background: selected ? "var(--accent)" : "rgba(8,8,15,.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 13, fontWeight: 800,
          }}
        >
          {selected ? "✓" : ""}
        </span>
      )}

      {(p.caption || p.uploadedBy) && (
        <div style={{ padding: "8px 10px" }}>
          {p.caption && (
            <div style={{ fontSize: 11, color: "var(--txt)", letterSpacing: ".04em" }}>{p.caption}</div>
          )}
          {p.uploadedBy && <div className="photo-byline">BY @{p.uploadedBy}</div>}
        </div>
      )}
    </div>
  );
}
