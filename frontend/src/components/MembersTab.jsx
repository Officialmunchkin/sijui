import { useVault } from "../VaultContext";
import Avatar from "./Avatar";
import { bdayInfo } from "../utils";

export default function MembersTab() {
  const v = useVault();
  const { members, search, canModerate, setMemberModal } = v;

  const q = search.trim().toUpperCase();
  let list = members;
  if (q) {
    list = list.filter(
      (m) =>
        m.name.toUpperCase().includes(q) ||
        m.handle.toUpperCase().includes(q) ||
        (m.relation || "").toUpperCase().includes(q)
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".18em", color: "#fff" }}>
          FAMILY MEMBERS ({members.length})
        </div>
        {canModerate && (
          <button className="btn primary mini" onClick={() => setMemberModal({ mode: "add" })}>
            + ADD MEMBER
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="empty">NO MEMBERS FOUND</div>
      ) : (
        <div className="members-grid">
          {list.map((m) => {
            const bd = bdayInfo(m);
            return (
              <div key={m.id} className="card" style={{ display: "flex", gap: 14 }}>
                <Avatar member={m} cls="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".12em", color: "#fff" }}>
                      {m.name}
                    </span>
                    {m.is_admin && <span className="tag admin">ADMIN</span>}
                    {m.is_guest && <span className="tag guest">GUEST</span>}
                  </div>
                  <div style={{ fontSize: 10, letterSpacing: ".16em", color: "var(--dim)", marginTop: 4 }}>
                    @{m.handle} • {m.relation}
                  </div>
                  {m.bio && (
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
                      {m.bio}
                    </div>
                  )}
                  {bd.text && (
                    <div
                      style={{
                        fontSize: 9, letterSpacing: ".14em", marginTop: 10, fontWeight: 700,
                        color: bd.isToday ? "var(--pink)" : bd.days != null && bd.days <= 7 ? "var(--amber)" : "var(--dim)",
                      }}
                    >
                      {bd.text}
                    </div>
                  )}
                  {canModerate && (
                    <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                      <button className="btn mini" onClick={() => setMemberModal({ mode: "edit", member: m })}>
                        EDIT
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
