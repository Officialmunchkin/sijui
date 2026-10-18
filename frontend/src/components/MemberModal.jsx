import { useState } from "react";
import { useVault } from "../VaultContext";

const COLORS = ["#8B5CF6", "#06B6D4", "#EC4899", "#F59E0B", "#10B981", "#6366F1", "#14B8A6"];

export default function MemberModal() {
  const v = useVault();
  const { mode, member } = v.memberModal;
  const editing = mode === "edit";

  const [form, setForm] = useState({
    name: member?.name || "",
    relation: member?.relation || "",
    bio: member?.bio || "",
    birthday: member?.birthday || "",
    color: member?.color || COLORS[0],
    is_admin: member?.is_admin || false,
    is_guest: member?.is_guest || false,
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function set(k, val) {
    setForm((f) => ({ ...f, [k]: val }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setErr("NAME REQUIRED");
    setBusy(true);
    setErr("");
    const payload = {
      ...form,
      name: form.name.toUpperCase(),
      relation: form.relation.toUpperCase() || "FAMILY",
      bio: form.bio.toUpperCase(),
    };
    const res = await v.saveMember(payload, mode, member?.id);
    setBusy(false);
    if (!res.ok) return setErr(res.error || "FAILED");
    v.setMemberModal(null);
  }

  return (
    <div className="overlay">
      <div className="backdrop" onClick={() => !busy && v.setMemberModal(null)} />
      <form className="modal" onSubmit={submit}>
        <button type="button" className="x" onClick={() => v.setMemberModal(null)} disabled={busy}>×</button>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".16em", color: "#fff", marginBottom: 18 }}>
          {editing ? `EDIT ${member.name}` : "ADD MEMBER"}
        </div>

        <div className="field-label">NAME</div>
        <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="FULL NAME" autoFocus />

        <div className="field-label" style={{ marginTop: 14 }}>RELATION</div>
        <input className="input" value={form.relation} onChange={(e) => set("relation", e.target.value)} placeholder="FATHER / MOTHER / SISTER..." />

        <div className="field-label" style={{ marginTop: 14 }}>BIRTHDAY (MM-DD)</div>
        <input className="input" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} placeholder="05-12" />

        <div className="field-label" style={{ marginTop: 14 }}>BIO</div>
        <textarea className="input" rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A LINE ABOUT THEM..." />

        <div className="field-label" style={{ marginTop: 14 }}>COLOR</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("color", c)}
              style={{
                width: 30, height: 30, borderRadius: "50%", background: c,
                border: form.color === c ? "3px solid #fff" : "1px solid var(--line)",
              }}
            />
          ))}
        </div>

        {v.isAdmin && (
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, letterSpacing: ".14em", color: "var(--muted)", cursor: "pointer" }}>
              <input type="checkbox" checked={form.is_admin} onChange={(e) => set("is_admin", e.target.checked)} />
              ADMIN
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, letterSpacing: ".14em", color: "var(--muted)", cursor: "pointer" }}>
              <input type="checkbox" checked={form.is_guest} onChange={(e) => set("is_guest", e.target.checked)} />
              GUEST
            </label>
          </div>
        )}

        {err && <div className="err-box">{err}</div>}

        <button className="btn primary" type="submit" disabled={busy || !form.name.trim()} style={{ width: "100%", marginTop: 18 }}>
          {busy ? "SAVING..." : editing ? "SAVE CHANGES" : "ADD MEMBER"}
        </button>
      </form>
    </div>
  );
}
