import { useVault } from "../VaultContext";
import Avatar from "./Avatar";
import { bdayInfo } from "../utils";

export default function AdminTab() {
  const v = useVault();
  const { members, albums, passwordSet, photos, trash, boardPosts, setNewAlbumOpen, setMemberModal } = v;

  async function setPassword(m) {
    const pw = window.prompt(`SET PASSWORD FOR ${m.name}:\n(leave empty to clear)`, "");
    if (pw == null) return;
    const res = await v.setMemberPassword(m.id, pw);
    if (!res.ok) v.toast(res.error || "FAILED");
  }

  async function remove(m) {
    if (!window.confirm(`REMOVE MEMBER "${m.name}"? THIS CANNOT BE UNDONE.`)) return;
    const res = await v.removeMember(m.id);
    if (!res.ok) v.toast(res.error || "REMOVE FAILED");
  }

  async function removeAlbum(a) {
    if (["UNSORTED", "TRASH"].includes(a)) return v.toast("SYSTEM ALBUM CANNOT BE DELETED");
    if (!window.confirm(`DELETE ALBUM "${a}"? PHOTOS MOVE TO UNSORTED.`)) return;
    const res = await v.deleteAlbum(a);
    if (!res.ok) v.toast(res.error || "DELETE FAILED");
  }

  const today = members.map((m) => ({ m, bd: bdayInfo(m) })).filter((x) => x.bd.isToday || (x.bd.days != null && x.bd.days <= 30));

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".18em", color: "#fff", marginBottom: 16 }}>
        ADMIN CONTROL PANEL
      </div>

      <div className="stat3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", marginBottom: 20 }}>
        <div className="stat-box">
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{photos.length}</div>
          <div className="stat-lbl">PHOTOS</div>
        </div>
        <div className="stat-box">
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{albums.length}</div>
          <div className="stat-lbl">ALBUMS</div>
        </div>
        <div className="stat-box">
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{members.length}</div>
          <div className="stat-lbl">MEMBERS</div>
        </div>
        <div className="stat-box">
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--danger)" }}>{trash.length}</div>
          <div className="stat-lbl">IN TRASH</div>
        </div>
        <div className="stat-box">
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{boardPosts.length}</div>
          <div className="stat-lbl">BOARD POSTS</div>
        </div>
      </div>

      <div className="card admin-2col" style={{ display: "grid", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".16em", color: "#fff" }}>MEMBERS</span>
            <button className="btn primary mini" onClick={() => setMemberModal({ mode: "add" })}>+ ADD</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: "var(--surface2)", border: "1px solid var(--line)", borderRadius: 12 }}>
                <Avatar member={m} cls="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: "#fff" }}>
                    {m.name} {m.is_admin && <span className="tag admin">ADMIN</span>}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--dim)" }}>
                    @{m.handle} • {passwordSet.includes(m.id) ? "PASSWORD SET" : "NO PASSWORD"}
                  </div>
                </div>
                <button className="btn mini" onClick={() => setMemberModal({ mode: "edit", member: m })}>EDIT</button>
                <button className="btn mini" onClick={() => setPassword(m)}>PW</button>
                <button className="btn danger mini" onClick={() => remove(m)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".16em", color: "#fff" }}>ALBUMS</span>
            <button className="btn primary mini" onClick={() => setNewAlbumOpen(true)}>+ NEW</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {albums.map((a) => {
              const isSystem = ["UNSORTED", "TRASH"].includes(a);
              return (
                <div key={a} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: "var(--surface2)", border: "1px solid var(--line)", borderRadius: 12 }}>
                  <div style={{ flex: 1, fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: "#fff" }}>
                    {a} {isSystem && <span className="tag guest">SYSTEM</span>}
                  </div>
                  {!isSystem && (
                    <button className="btn danger mini" onClick={() => removeAlbum(a)}>DELETE</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".16em", color: "#fff", marginBottom: 12 }}>
          UPCOMING BIRTHDAYS
        </div>
        {today.length === 0 ? (
          <div className="empty" style={{ padding: 20 }}>NONE IN THE NEXT 30 DAYS</div>
        ) : (
          <div className="bday-grid" style={{ display: "grid", gap: 8 }}>
            {today.map(({ m, bd }) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: "var(--surface2)", border: "1px solid var(--line)", borderRadius: 12 }}>
                <Avatar member={m} cls="sm" />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{m.name}</div>
                  <div style={{ fontSize: 9, color: bd.isToday ? "var(--pink)" : "var(--amber)", letterSpacing: ".1em" }}>
                    {bd.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
