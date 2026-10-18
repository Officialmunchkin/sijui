import { useState } from "react";
import { useVault } from "../VaultContext";

export default function NewAlbumModal() {
  const v = useVault();
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return setErr("ALBUM NAME REQUIRED");
    setBusy(true);
    setErr("");
    const res = await v.createAlbum(name);
    setBusy(false);
    if (!res.ok) return setErr(res.error || "FAILED");
    v.setNewAlbumOpen(false);
  }

  return (
    <div className="overlay">
      <div className="backdrop" onClick={() => !busy && v.setNewAlbumOpen(false)} />
      <form className="modal" onSubmit={submit}>
        <button type="button" className="x" onClick={() => v.setNewAlbumOpen(false)} disabled={busy}>×</button>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".16em", color: "#fff", marginBottom: 18 }}>
          NEW ALBUM
        </div>

        <div className="field-label">ALBUM NAME</div>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="SUMMER 25"
          autoFocus
        />

        {err && <div className="err-box">{err}</div>}

        <button className="btn primary" type="submit" disabled={busy || !name.trim()} style={{ width: "100%", marginTop: 18 }}>
          {busy ? "CREATING..." : "CREATE ALBUM"}
        </button>
      </form>
    </div>
  );
}
