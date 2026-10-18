import { useState } from "react";
import { useVault } from "../VaultContext";
import * as api from "../api";

export default function UploadModal() {
  const v = useVault();
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [album, setAlbum] = useState(v.albumFilter !== "ALL" ? v.albumFilter : "UNSORTED");
  const [tagged, setTagged] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function onFile(e) {
    setFile(e.target.files?.[0] || null);
    setErr("");
  }

  function toggleTag(id) {
    setTagged((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) return setErr("PICK A PHOTO OR VIDEO");
    setBusy(true);
    setErr("");
    try {
      await api.apiUpload(file, caption.toUpperCase(), album, v.me?.id || "unknown", tagged);
      v.setUploadOpen(false);
      v.toast("UPLOADED");
      v.loadMedia();
    } catch (e2) {
      setErr(e2.message || "UPLOAD FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay">
      <div className="backdrop" onClick={() => !busy && v.setUploadOpen(false)} />
      <form className="modal" onSubmit={submit}>
        <button type="button" className="x" onClick={() => v.setUploadOpen(false)} disabled={busy}>×</button>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".16em", color: "#fff", marginBottom: 18 }}>
          UPLOAD TO VAULT
        </div>

        <label
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 8, padding: "28px 16px", borderRadius: 16, cursor: "pointer",
            background: "#0E0E1E", border: "1px dashed var(--line)", textAlign: "center",
          }}
        >
          <span style={{ fontSize: 28 }}>{file ? "📎" : "⬆"}</span>
          <span style={{ fontSize: 10, letterSpacing: ".14em", color: file ? "#fff" : "var(--dim)" }}>
            {file ? file.name : "TAP TO CHOOSE PHOTO OR VIDEO"}
          </span>
          <input type="file" accept="image/*,video/*" onChange={onFile} style={{ display: "none" }} />
        </label>

        <div className="field-label" style={{ marginTop: 16 }}>CAPTION</div>
        <input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="WHAT'S THE STORY?" />

        <div className="field-label" style={{ marginTop: 14 }}>ALBUM</div>
        <select className="input" value={album} onChange={(e) => setAlbum(e.target.value)}>
          {v.albums.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <div className="field-label" style={{ marginTop: 14 }}>TAG FAMILY</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {v.members.filter((m) => !m.is_guest).map((m) => (
            <button
              key={m.id}
              type="button"
              className={`btn mini ${tagged.includes(m.id) ? "primary" : ""}`}
              onClick={() => toggleTag(m.id)}
            >
              {m.name}
            </button>
          ))}
        </div>

        {err && <div className="err-box">{err}</div>}

        <button className="btn primary" type="submit" disabled={busy || !file} style={{ width: "100%", marginTop: 18 }}>
          {busy ? "UPLOADING..." : "UPLOAD"}
        </button>
      </form>
    </div>
  );
}
