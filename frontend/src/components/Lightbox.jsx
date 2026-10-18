import { useEffect } from "react";
import { useVault } from "../VaultContext";
import Avatar from "./Avatar";

export default function Lightbox() {
  const v = useVault();
  const p = v.lightbox;
  const { me, isGuest, canModerate } = v;

  const uploader = v.members.find((m) => m.id === p.uploadedBy);
  const taggedMembers = (p.tagged || []).map((id) => v.members.find((m) => m.id === id)).filter(Boolean);
  const canDelete = canModerate || (!isGuest && me?.id === p.uploadedBy);

  function close() {
    v.setLightbox(null);
  }

  async function del() {
    if (!window.confirm("MOVE THIS PHOTO TO TRASH?")) return;
    await v.trashPhotos([p.id]);
    close();
  }

  // keyboard nav
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="overlay">
      <div className="backdrop" onClick={close} />
      <div className="lb-panel">
        <div style={{ flex: 2, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 260 }}>
          {p.type === "video" ? (
            <video src={p.src} controls autoPlay style={{ maxWidth: "100%", maxHeight: "70vh" }} />
          ) : (
            <img src={p.src} alt={p.caption || ""} style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }} />
          )}
        </div>

        <div style={{ flex: 1, padding: 20, position: "relative", overflowY: "auto" }}>
          <button className="x" onClick={close}>×</button>

          <div style={{ fontSize: 9, letterSpacing: ".2em", color: "var(--accent)", fontWeight: 800 }}>
            {p.album || "UNSORTED"}
          </div>
          {p.caption && (
            <div style={{ fontSize: 13, color: "#fff", marginTop: 10, lineHeight: 1.5 }}>{p.caption}</div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
            {uploader && <Avatar member={uploader} cls="sm" />}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: "#fff" }}>
                @{p.uploadedBy || "UNKNOWN"}
              </div>
              <div style={{ fontSize: 9, color: "var(--dim)" }}>
                {p.date || ""} {p.size ? `• ${(p.size / 1024 / 1024).toFixed(1)}MB` : ""}
              </div>
            </div>
          </div>

          {taggedMembers.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: ".2em", color: "var(--dim)", marginBottom: 8 }}>TAGGED</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {taggedMembers.map((m) => (
                  <span key={m.id} className="member-relation">@{m.handle}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 22, flexWrap: "wrap" }}>
            {!isGuest && (
              <a className="btn mini" href={p.src} download target="_blank" rel="noreferrer">
                DOWNLOAD
              </a>
            )}
            {canDelete && (
              <button className="btn danger mini" onClick={del}>
                MOVE TO TRASH
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
